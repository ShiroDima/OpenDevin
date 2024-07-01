from opendevin.core.utils import zip_folder, unzip_folder, remove_zip
from opendevin.server.db.main import ChatHistoryDB

def save_workspace(uid: str, db: ChatHistoryDB):
    zip_path: str = f"./workspace/{uid}.zip"
    done = zip_folder(zip_path=zip_path)
    if done is None:
        return
    if done:
        file_id = db.save_user_zipped_file(zip_path=zip_path, uid=uid)
        remove_zip(zip_path)
        return file_id

def build_workspace(uid: str, db: ChatHistoryDB):
    zip_path: str = f"./workspace/{uid}.zip"
    done = db.get_and_save_user_zipped_files(uid=uid)
    if not done:
        return done
    
    unzip_folder(zip_path=zip_path)

    remove_zip(zip_path)

    return True
