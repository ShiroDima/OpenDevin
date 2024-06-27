from typing import Dict, Literal, List

from pydantic import BaseModel


class ActionHistory(BaseModel):
    action: str
    args: Dict[str, str]


class ChatHistory(BaseModel):
    sender: Literal["user", "assistant"]
    content: str


class History(BaseModel):
    action_history: List[ActionHistory]
    chat_history: List[ChatHistory]


class ChatInfo(BaseModel):
    uid: str
    action_history: List[ActionHistory]
    chat_history: List[ChatHistory]