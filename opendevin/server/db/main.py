from typing import  Dict, Any, List
import pymongo
from pymongo import MongoClient, errors
from bson.objectid import ObjectId
from .models import ChatInfo, History, ActionHistory, ChatHistory
from .exceptions import InsertionError, FindError, UpdateError

from opendevin.core.logger import opendevin_logger as logger

class ChatHistoryDB:
    def __init__(self, uri: str):
        self.uri = uri
        self._client = self.connect()
        self._history = self._get_collection()

    def connect(self):
        # client = MongoClient("mongodb://root:example@localhost:27017/")
        client = MongoClient(self.uri)

        try:
            client.admin.command('ping')
            logger.info("Pinged your deployment. You successfully connected to MongoDB!")
        except Exception as e:
            print(e)

        # TODO Catch pymongo.errors.ServerSelectionTimeoutError

        return client

    def _get_collection(self):
        chat_history = self._client.history.ChatHistory
        chat_history.create_index([("uid", pymongo.ASCENDING)], unique=True)
        return chat_history

    def create_new_user_history(self, chat_info: ChatInfo) -> str:
        try:
            _id = self._history.insert_one(chat_info.model_dump()).inserted_id
        except errors.DuplicateKeyError as error:
            # raise InsertionError(
            #     f"A chat history for the user with email {chat_info.uid} already exists"
            # )
            raise InsertionError(error.details)

        return str(_id)


    def update_user_history(self, id: str, history: ActionHistory | ChatHistory, history_type=str) -> Dict[str, Any]:
        assert isinstance(history, ActionHistory) or isinstance(history, ChatHistory), "Please send the data in the right format. Expected one of ChatHistory or ActionHistory."

        _history = "action_history" if history_type == "action" else "chat_history"

        try:
            result = self._history.update_one(
                { "uid": id },
                {
                    "$push": {
                        _history: history.model_dump()
                    }
                }
            )
        except errors.OperationFailure:
            raise UpdateError(f'Could not add action history for user with id {id}')

        return result
    
    def get_user_chat_info(self, id: str) -> ChatInfo | None:
        # print(id)
        try:
            results: ChatInfo = self._history.find_one({"uid": id})
            # print(results)
        except errors.OperationFailure:
            raise FindError(f"Could not perform the requested find for id {id}")

        if results is None:
            return None
        if len(results["chat_history"]) == 0:
            return []

        return results
    