from typing import  Dict, Any, List
import pymongo
import gridfs
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
        self._fs = gridfs.GridFS(self._client.history)

    def connect(self):
        # client = MongoClient("mongodb://root:example@localhost:27017/")

        try:
            client = MongoClient(self.uri)
            client.admin.command('ping')
            logger.info("Pinged your deployment. You successfully connected to MongoDB!")
        except errors.ServerSelectionTimeoutError as error:
            logger.error('Could not connect to the MongoDB server.')
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

    def save_user_zipped_file(self, zip_path: str, uid: str):
        # Find any prevoiusly saved workspace data
        data = self._fs.find({"metadata.uid": uid})
        for file in data:
            # Delete all previously saved workspace data to avoid duplicating saved data 
            # with same UIDs but different IDs
            self._fs.delete(file._id)

        with open(zip_path, 'rb') as file:
            file_data = file.read()
        file_id = self._fs.put(file_data, filename=zip_path, metadata={"uid": uid})

        return file_id

    def get_and_save_user_zipped_files(self, uid: str, output_path: str = "./workspace") -> bool:
        data = self._fs.find({"metadata.uid": uid})
        if not data or data is None:
            return False
        for file in data:
            file_data = self._fs.get(file._id).read()

            with open(f"{output_path}/{uid}.zip", 'wb') as file:
                file.write(file_data)

            logger.info(f"Written workspace data {output_path}/{uid}.zip successfully.")

        return True
    