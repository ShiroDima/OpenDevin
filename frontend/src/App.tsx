/* eslint-disable no-console */
/* eslint-disable prettier/prettier */
import { useDispatch, useSelector } from "react-redux"
// import { useNavigate } from "react-router-dom";
// import { Hanko } from "@teamhanko/hanko-elements";
import { useDisclosure } from "@nextui-org/react";
import React, { useEffect, useState, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import CogTooth from "#/assets/cog-tooth";
import ChatInterface from "#/components/chat/ChatInterface";
import Errors from "#/components/Errors";
import { Container, Orientation } from "#/components/Resizable";
import Workspace from "#/components/Workspace";
import LoadPreviousSessionModal from "#/components/modals/load-previous-session/LoadPreviousSessionModal";
import SettingsModal from "#/components/modals/settings/SettingsModal";
import "./App.css";
import AgentControlBar from "./components/AgentControlBar";
import AgentStatusBar from "./components/AgentStatusBar";
import Terminal from "./components/terminal/Terminal";
import Session from "#/services/session";
import { getID, getToken } from "#/services/auth";
import { settingsAreUpToDate } from "#/services/settings";
import { RootState } from "#/store";
import AgentState from "#/types/AgentState"
import { listFiles,  } from "./services/fileService";
import { setRefreshID } from "./state/codeSlice";

interface Props {
  setSettingOpen: (isOpen: boolean) => void;
}

const BASEURL = import.meta.env.VITE_BACKEND_HOST;

function Controls({ setSettingOpen }: Props): JSX.Element {
  return (
    <div className="flex w-full p-4 bg-neutral-900 items-center shrink-0 justify-between">
      <div className="flex items-center gap-4">
        <AgentControlBar />
      </div>
      <AgentStatusBar />
      <div
        className="cursor-pointer hover:opacity-80 transition-all"
        onClick={() => setSettingOpen(true)}
      >
        <CogTooth />
      </div>
    </div>
  );
}

// React.StrictMode will cause double rendering, use this to prevent it
let initOnce = false;
// const hankoApi = import.meta.env.VITE_HANKO_API_URL;

function App(): JSX.Element {
  // const navigate = useNavigate()
  // const { userID: id } = useSessionData();
  // const hanko = useMemo(() => new Hanko(hankoApi), []);
  const dispatch = useDispatch();
  const [init, setInit] = useState(false)
  const checkInit = React.useRef(false)
  const userID = useCallback(() => getID(), [])
  const token = useCallback(() => getToken(), [])
  const { curAgentState } = useSelector((state: RootState) => state.agent)
  // const { id } = useUserData();

  const {
    isOpen: settingsModalIsOpen,
    onOpen: onSettingsModalOpen,
    onOpenChange: onSettingsModalOpenChange,
  } = useDisclosure();

  const {
    isOpen: loadPreviousSessionModalIsOpen,
    onOpen: onLoadPreviousSessionModalOpen,
    onOpenChange: onLoadPreviousSessionModalOpenChange,
  } = useDisclosure();

  // useEffect(() => {
  //   if(!userID){
  //     // alert(userID)
  //     // hanko?.user.logout().catch(error => console.log(error))
  //     navigate('/login')
  //   }
  // }, [])

  const loadWorkspace = (): void => {
    console.log("Loading workspace...")
    fetch(`http://${BASEURL}/api/history/workspace/${getID()}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      }
    })
    .then(res => {
      if(!res.ok){
        if(res.status !== 404){
          throw new Error('An error occured while retrieving the workspace')
        }
      }
      // res.json()
    })
    // .then(() => {
    //   // dispatch(setRefreshID(Math.random()));
    //   // listFiles("/").then().catch(console.log);
    // })
    .catch(console.log)
  }

  useEffect(() => {
    // console.log('This is firing')
    // console.log(checkInit.current)
    // console.log(curAgentState)
    // console.log(token())

    if(checkInit.current) return
    if(curAgentState !== AgentState.INIT) return
    if(token()){
      console.log('Token found, loading workspace')
      setInit(true)
      checkInit.current = true
      loadWorkspace();
    }
  }, [curAgentState])

  

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex grow bg-neutral-900 text-white min-h-0">
        <Container
          orientation={Orientation.HORIZONTAL}
          className="grow h-full min-h-0 min-w-0 px-3 pt-3"
          initialSize={500}
          firstChild={<ChatInterface />}
          firstClassName="min-w-[500px] rounded-xl overflow-hidden border border-neutral-600"
          secondChild={
            <Container
              orientation={Orientation.VERTICAL}
              className="grow h-full min-h-0 min-w-0"
              initialSize={window.innerHeight - 300}
              firstChild={<Workspace />}
              firstClassName="min-h-72 rounded-xl border border-neutral-600 bg-neutral-800 flex flex-col overflow-hidden"
              secondChild={<Terminal />}
              secondClassName="min-h-72 rounded-xl border border-neutral-600 bg-neutral-800"
            />
          }
          secondClassName="flex flex-col overflow-hidden grow min-w-[500px]"
        />
      </div>
      <Controls setSettingOpen={onSettingsModalOpen} />
      <SettingsModal
        isOpen={settingsModalIsOpen}
        onOpenChange={onSettingsModalOpenChange}
      />
      <LoadPreviousSessionModal
        isOpen={loadPreviousSessionModalIsOpen}
        onOpenChange={onLoadPreviousSessionModalOpenChange}
      />
      <Errors />
      <Toaster />
    </div>
  );
}

export default App;
