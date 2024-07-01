/* eslint-disable prettier/prettier */
import { addAssistantMessage, addUserMessage } from "#/state/chatSlice";
import { setCode, setActiveFilepath } from "#/state/codeSlice";
import { appendInput } from "#/state/commandSlice";
import { appendJupyterInput } from "#/state/jupyterSlice";
import { setRootTask } from "#/state/taskSlice";
import store from "#/store";
import ActionType from "#/types/ActionType";
import { ActionMessage } from "#/types/Message";
import { SocketMessage } from "#/types/ResponseType";
import { handleObservationMessage } from "./observations";
import { getRootTask } from "./taskService";
import {request} from './api'
import { getID, getToken } from "./auth";

const BASEURL = import.meta.env.VITE_BACKEND_HOST;


const addChatMessage = (source: string, body: string): void => {
  if(!body.startsWith('Error')){
    request(`http://${BASEURL}/api/history/update/${getID()}?type=chat`, 
        {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json', // Set the Content-Type header,
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify(
            {
              sender: source,
              content: body,
            }),
        }
  )
  .then(res => res.json())
  .catch(err => console.log(err));
  }
}


const messageActions = {
  [ActionType.BROWSE]: (message: ActionMessage) => {
    store.dispatch(addAssistantMessage(message.message));
    addChatMessage("assistant", message.message)
  },
  [ActionType.BROWSE_INTERACTIVE]: (message: ActionMessage) => {
    if (message.args.thought) {
      store.dispatch(addAssistantMessage("assistant", message.args.thought));
      addChatMessage("assistant", message.args.thought)
      
    } else {
      store.dispatch(addAssistantMessage(message.message));
      addChatMessage("assistant", message.message)
    }
  },
  [ActionType.WRITE]: (message: ActionMessage) => {
    const { path, content } = message.args;
    store.dispatch(setActiveFilepath(path));
    store.dispatch(setCode(content));
  },
  [ActionType.MESSAGE]: (message: ActionMessage) => {
    if (message.source === "user") {
      store.dispatch(addUserMessage(message.args.content));
      addChatMessage("user", message.args)
    } else {
      store.dispatch(addAssistantMessage(message.args.content));
      addChatMessage("assistant", message.message)
    }
  },
  [ActionType.FINISH]: (message: ActionMessage) => {
    store.dispatch(addAssistantMessage(message.message));
    addChatMessage("assistant", message.message)
  },
  [ActionType.RUN]: (message: ActionMessage) => {
    if (message.args.thought) {
      store.dispatch(addAssistantMessage(message.args.thought));
      addChatMessage("assistant", message.args.thought)
    }
    store.dispatch(appendInput(message.args.command));
  },
  [ActionType.RUN_IPYTHON]: (message: ActionMessage) => {
    if (message.args.thought) {
      store.dispatch(addAssistantMessage(message.args.thought));
      addChatMessage("assistant", message.args.thought)
    }
    store.dispatch(appendJupyterInput(message.args.code));
  },
  [ActionType.ADD_TASK]: () => {
    getRootTask().then((fetchedRootTask) =>
      store.dispatch(setRootTask(fetchedRootTask)),
    );
  },
  [ActionType.MODIFY_TASK]: () => {
    getRootTask().then((fetchedRootTask) =>
      store.dispatch(setRootTask(fetchedRootTask)),
    );
  },
};

export function handleActionMessage(message: ActionMessage) {
  if (message.action in messageActions) {
    const actionFn =
      messageActions[message.action as keyof typeof messageActions];
    actionFn(message);
  }
}

export function handleAssistantMessage(data: string | SocketMessage) {
  let socketMessage: SocketMessage;

  if (typeof data === "string") {
    socketMessage = JSON.parse(data) as SocketMessage;
  } else {
    socketMessage = data;
  }

  if ("action" in socketMessage) {
    handleActionMessage(socketMessage);
  } else {
    handleObservationMessage(socketMessage);
  }
}
