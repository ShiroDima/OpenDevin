import os
import zipfile
import shutil

exclude_list = (
        '.git',
        '.DS_Store',
        '.svn',
        '.hg',
        '.idea',
        '.vscode',
        '.settings',
        '.pytest_cache',
        '__pycache__',
        'node_modules',
        'vendor',
        'build',
        'dist',
        'bin',
        'logs',
        'log',
        'tmp',
        'temp',
        'coverage',
        'venv',
        'env',
    )

def zip_folder(zip_path: str, folder_path: str = "./workspace"):
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(folder_path):
            if len(files) == 0: return
            for file in files:
                if file not in exclude_list:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, folder_path)
                    zipf.write(file_path, arcname)
            return True

def unzip_folder(zip_path: str, folder_path: str = "./workspace") -> None:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(folder_path)


def remove_zip(zip_path: str):
    if os.path.exists(zip_path):
        os.remove(zip_path)