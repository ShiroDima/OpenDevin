import ActionType from "#/types/ActionType";
import Session from "./session";


export function sendChatMessage(message: string, baseURL: string, userID: string): void {
  const event = { action: ActionType.MESSAGE, args: { content: message } };
  const eventString = JSON.stringify(event);
  Session.send(eventString);

  fetch(`http://${baseURL}/api/history/update/${userID}?type=action`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json' // Set the Content-Type header
    },
    body: eventString,
  })
  .then(res => res.json())
  .then(res => res.updated ? null : console.log('Could not add chat to history'))

}
