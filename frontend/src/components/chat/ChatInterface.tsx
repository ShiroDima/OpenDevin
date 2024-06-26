/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable prettier/prettier */
import React, { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { IoMdChatbubbles } from "react-icons/io";
import { RiArrowRightDoubleLine } from "react-icons/ri";
import { useTranslation } from "react-i18next";
import { VscArrowDown } from "react-icons/vsc";
import { FaRegThumbsDown, FaRegThumbsUp } from "react-icons/fa";
import { useDisclosure } from "@nextui-org/react";
import ChatInput from "./ChatInput";
import Chat from "./Chat";
import { RootState } from "#/store";
import AgentState from "#/types/AgentState";
import { sendChatMessage } from "#/services/chatService";
import {
  addUserMessage,
  addAssistantMessage,
  clearMessages,
} from "#/state/chatSlice";
import { I18nKey } from "#/i18n/declaration";
import { useScrollToBottom } from "#/hooks/useScrollToBottom";
import { Feedback } from "#/services/feedbackService";
import FeedbackModal from "../modals/feedback/FeedbackModal";
import { removeApiKey } from "#/utils/utils";
import Session from "#/services/session";
import { getID, getToken } from "#/services/auth";
// import { useSessionData } from "#/hooks/useSessionData";
// import { useUserData } from "#/hooks/useUserData";
import { request } from "#/services/api";

interface ScrollButtonProps {
  onClick: () => void;
  icon: JSX.Element;
  label: string;
  // eslint-disable-next-line react/require-default-props
  disabled?: boolean;
}

type ActionHistory = {
  action: string;
  args: { content: string };
};

type ChatHistory = {
  sender: string;
  content: string;
};

interface ChatInfo {
  uid: string;
  action_history: ActionHistory[];
  chat_history: ChatHistory[];
}

const BASEURL = import.meta.env.VITE_BACKEND_HOST;

const createNewUser = (userID: string): void => {
  fetch(`http://${BASEURL}/api/history/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ uid: userID, action_history: [], chat_history: [] }),
  })
    .then((res) => {
      if (res.ok)  return;
      if (!res.ok) throw new Error("Could not create user history");
    })
    .then(() => console.log("CREATED A NEW USER"))
    .catch((error) => console.log(error));
};

const fetchHistories = (userID: string, dispatch: any, curAgentState: any, messages: ChatHistory[], t: any): void => {
  fetch(`http://${BASEURL}/api/history/${userID}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  })
    .then((res) => {
      if (res.status === 404) {
        createNewUser(userID);
        if (curAgentState === AgentState.INIT && messages.length === 0) {
          dispatch(addAssistantMessage(t(I18nKey.CHAT_INTERFACE$INITIAL_MESSAGE)));
        }
        return;
      }
      return res.json();
    })
    .then((chatInfo: ChatInfo) => {
      if (!chatInfo) return;
      const { chat_history, action_history } = chatInfo;
      clearMessages()
      chat_history.forEach((hist: ChatHistory) => {
        // console.log(hist)
        const { sender, content } = hist;
        sender === "user"
          ? dispatch(addUserMessage(content))
          : dispatch(addAssistantMessage(content));
      });
      Session._history = action_history;
      // })
    })
    .catch((error) => console.log(error));
};

function ScrollButton({
  onClick,
  icon,
  label,
  disabled = false,
}: ScrollButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className="relative border-1 text-xs rounded px-2 py-1 border-neutral-600 bg-neutral-700 cursor-pointer select-none"
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-center">
        {icon} <span className="inline-block">{label}</span>
      </div>
    </button>
  );
}

function ChatInterface() {
  const { t } = useTranslation();
  const checkInit = React.useRef(false);
  const location = useLocation();
  let { initOnce } = location.state || {};
  checkInit.current = initOnce;
  
  const dispatch = useDispatch();
  const { messages } = useSelector((state: RootState) => state.chat);
  const { curAgentState } = useSelector((state: RootState) => state.agent);

  // const { userID } = useSessionData();
  const userID = React.useMemo(() => getID(), [])
  const token = React.useCallback(() => getToken(), [])

  const feedbackVersion = "1.0";

  const [feedback, setFeedback] = React.useState<Feedback>({
    email: "",
    feedback: "positive",
    permissions: "private",
    trajectory: [],
    token: "",
    version: feedbackVersion,
  });
  const [feedbackShared, setFeedbackShared] = React.useState(0);

  const {
    isOpen: feedbackModalIsOpen,
    onOpen: onFeedbackModalOpen,
    onOpenChange: onFeedbackModalOpenChange,
  } = useDisclosure();

  useEffect(() => {
    // checkInit.current = initOnce

    if (checkInit.current) {
      return;
    }
    if(!token()) return

    // setInitOnce(true);
    if(curAgentState===AgentState.INIT){
      initOnce = true;
      // clearMessages()
      checkInit.current = initOnce;
      if (!userID) {
        if (getID() !== "") {
          fetchHistories(getID(), dispatch, curAgentState, messages, t);
        } else {
          setTimeout(() => fetchHistories(userID, dispatch, curAgentState, messages, t), 10000);
        }
      } else {
        console.log('Fetching histories')
        fetchHistories(userID, dispatch, curAgentState, messages, t);
      }
      
    }

    return () => {dispatch(clearMessages())};
  }, [curAgentState]);

  const shareFeedback = async (polarity: "positive" | "negative") => {
    setFeedbackShared(messages.length);
    setFeedback((prev) => ({
      ...prev,
      feedback: polarity,
      trajectory: removeApiKey(Session._history),
      token: getToken(),
    }));
    onFeedbackModalOpen();
  };

  const handleSendMessage = (content: string) => {
    dispatch(addUserMessage(content));
      request(
        `http://${BASEURL}/api/history/update/${userID}?type=chat`,
        {
          method: "put",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: "user",
            content,
          }),
        }
      )
      .then((res) => res.json())
      .then((res) =>
        res.updated ? null : console.log("Could not add chat to history"),
      );
    sendChatMessage(content, BASEURL, userID);
  };

  const handleEmailChange = (key: string) => {
    setFeedback({ ...feedback, email: key } as Feedback);
  };

  const handlePermissionsChange = (permissions: "public" | "private") => {
    setFeedback({ ...feedback, permissions } as Feedback);
  };


  const handleSendContinueMsg = () => {
    handleSendMessage(t(I18nKey.CHAT_INTERFACE$INPUT_CONTINUE_MESSAGE));
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const { scrollDomToBottom, onChatBodyScroll, hitBottom } =
    useScrollToBottom(scrollRef);

  // React.useEffect(() => {
  //   if (curAgentState === AgentState.INIT && messages.length === 0) {
  //     dispatch(addAssistantMessage(t(I18nKey.CHAT_INTERFACE$INITIAL_MESSAGE)));
  //   }
  // }, [curAgentState, dispatch, messages.length, t]);

  return (
    <div className="flex flex-col h-full bg-neutral-800">
      <div className="flex items-center gap-2 border-b border-neutral-600 text-sm px-4 py-2">
        <IoMdChatbubbles />
        Chat
      </div>
      <div className="flex-1 flex flex-col relative min-h-0">
        <div
          ref={scrollRef}
          className="overflow-y-auto p-3"
          onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        >
          <Chat messages={messages} />
        </div>
      </div>

      <div className="relative">
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
          {!hitBottom &&
            ScrollButton({
              onClick: scrollDomToBottom,
              icon: <VscArrowDown className="inline mr-2 w-3 h-3" />,
              label: t(I18nKey.CHAT_INTERFACE$TO_BOTTOM),
            })}
          {curAgentState === AgentState.AWAITING_USER_INPUT &&
            hitBottom &&
            ScrollButton({
              onClick: handleSendContinueMsg,
              icon: <RiArrowRightDoubleLine className="inline mr-2 w-3 h-3" />,
              label: t(I18nKey.CHAT_INTERFACE$INPUT_CONTINUE_MESSAGE),
            })}
        </div>

        {feedbackShared !== messages.length && messages.length > 3 && (
          <div className="flex justify-start gap-2 p-2">
            <ScrollButton
              onClick={() => shareFeedback("positive")}
              icon={<FaRegThumbsUp className="inline mr-2 w-3 h-3" />}
              label=""
            />
            <ScrollButton
              onClick={() => shareFeedback("negative")}
              icon={<FaRegThumbsDown className="inline mr-2 w-3 h-3" />}
              label=""
            />
          </div>
        )}
      </div>

      <ChatInput
        disabled={curAgentState === AgentState.LOADING}
        onSendMessage={handleSendMessage}
      />
      <FeedbackModal
        feedback={feedback}
        handleEmailChange={handleEmailChange}
        handlePermissionsChange={handlePermissionsChange}
        isOpen={feedbackModalIsOpen}
        onOpenChange={onFeedbackModalOpenChange}
      />
    </div>
  );
}

export default ChatInterface;
