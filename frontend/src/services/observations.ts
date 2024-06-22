import { changeAgentState } from "#/state/agentSlice";
import { setUrl, setScreenshotSrc } from "#/state/browserSlice";
import store from "#/store";
import { ObservationMessage } from "#/types/Message";
import { appendOutput } from "#/state/commandSlice";
import { appendJupyterOutput } from "#/state/jupyterSlice";
import ObservationType from "#/types/ObservationType";
import { addAssistantMessage } from "#/state/chatSlice";
import { getID } from "./auth";

const BASEURL = import.meta.env.VITE_BACKEND_HOST;


export function handleObservationMessage(message: ObservationMessage) {
  switch (message.observation) {
    case ObservationType.RUN:
      store.dispatch(appendOutput(message.content));
      break;
    case ObservationType.RUN_IPYTHON:
      // FIXME: render this as markdown
      store.dispatch(appendJupyterOutput(message.content));
      break;
    case ObservationType.BROWSE:
      if (message.extras?.screenshot) {
        store.dispatch(setScreenshotSrc(message.extras?.screenshot));
      }
      if (message.extras?.url) {
        store.dispatch(setUrl(message.extras.url));
      }
      break;
    case ObservationType.AGENT_STATE_CHANGED:
      store.dispatch(changeAgentState(message.extras.agent_state));
      break;
    default:
      store.dispatch(addAssistantMessage(message.message));
      fetch(`http://${BASEURL}/api/history/update/${getID()}?type=chat`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json' // Set the Content-Type header
        },
        body: JSON.stringify(
          {
            sender: "assistant",
            content: message.message,
          }),
      })
      .then(res => res.json())
      .then(res => res.updated ? null : console.log('Could not add chat to history'))
      break;
  }
}
