import os
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError

logger = logging.getLogger(__name__)

MONGODB_URI = os.environ.get("MONGODB_URI")
MONGODB_DATABASE = os.environ.get("MONGODB_DATABASE", "ulpin")

_client = None
_db = None

def get_mongodb_client():
    global _client, _db
    if not MONGODB_URI:
        return None

    if _client is None:
        try:
            # Low timeout for responsive fallback logic
            _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
            _client.admin.command('ping')
            _db = _client[MONGODB_DATABASE]
            logger.info("Successfully connected to MongoDB Atlas.")
        except (ConnectionFailure, ConfigurationError) as e:
            logger.warning(f"MongoDB connection failed: {e}")
            _client = None
            _db = None
    return _client

def get_mongodb_db():
    get_mongodb_client()
    return _db

def is_mongodb_connected() -> bool:
    client = get_mongodb_client()
    if not client:
        return False
    try:
        client.admin.command('ping')
        return True
    except Exception:
        return False
