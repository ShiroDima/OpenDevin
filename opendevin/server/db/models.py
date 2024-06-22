from typing import Dict, Literal, List

from pydantic import BaseModel, EmailStr, Field


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
    # id: str = Field(..., alias="_id")
    uid: str
    action_history: List[ActionHistory]
    chat_history: List[ChatHistory]