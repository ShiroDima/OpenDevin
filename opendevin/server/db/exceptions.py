class DatabaseError(Exception):
    """Base class for custom database exceptions."""
    def __init__(self, message):
        super().__init__(message)
        self.message = message

class InsertionError(DatabaseError):
    """Raised for any error that occurs when inserting a document or documents"""
    pass

class FindError(DatabaseError):
    """Raised for any error that occurs when finding a document"""
    pass


class UpdateError(DatabaseError):
    """Raised for any error that occurs when updaeting a document"""
    pass
