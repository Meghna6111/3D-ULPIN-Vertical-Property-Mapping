from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import sqlite3
import json
import logging
import datetime
import os
import database
import mongodb

logger = logging.getLogger(__name__)

class PropertyRepository(ABC):
    @abstractmethod
    def save(self, parcel: Dict[str, Any], owner_uid: Optional[str] = None) -> bool:
        pass

    @abstractmethod
    def get(self, parcel_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_all(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete(self, parcel_id: str, owner_uid: Optional[str] = None) -> bool:
        pass

    @abstractmethod
    def search(self, query: str) -> List[Dict[str, Any]]:
        pass


class SQLitePropertyRepository(PropertyRepository):
    def save(self, parcel: Dict[str, Any], owner_uid: Optional[str] = None) -> bool:
        parcel_id = parcel.get("id")
        label = parcel.get("label", "")
        longitude = parcel.get("longitude", 0.0)
        latitude = parcel.get("latitude", 0.0)
        land_area = parcel.get("landAreaSqft", 0.0)
        status = parcel.get("status", "verified")

        # Handle ownership in json data payload
        payload = dict(parcel)
        if owner_uid:
            payload["ownerUid"] = owner_uid

        # Check existing ownership first if owner_uid is supplied
        if owner_uid:
            existing = self.get(parcel_id)
            if existing and existing.get("ownerUid") and existing.get("ownerUid") != owner_uid:
                logger.warning(f"Permission denied for updating SQLite parcel {parcel_id}")
                return False

        data_json = json.dumps(payload)

        try:
            with database.get_connection() as conn:
                conn.execute("""
                    INSERT INTO parcels (id, label, longitude, latitude, land_area, status, data_json, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                    ON CONFLICT(id) DO UPDATE SET
                        label=excluded.label,
                        longitude=excluded.longitude,
                        latitude=excluded.latitude,
                        land_area=excluded.land_area,
                        status=excluded.status,
                        data_json=excluded.data_json,
                        updated_at=datetime('now')
                """, (parcel_id, label, longitude, latitude, land_area, status, data_json))
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"SQLite save failed: {e}")
            return False

    def get(self, parcel_id: str) -> Optional[Dict[str, Any]]:
        try:
            with database.get_connection() as conn:
                row = conn.execute("SELECT data_json FROM parcels WHERE id = ?", (parcel_id,)).fetchone()
                if row:
                    return json.loads(row["data_json"])
        except Exception as e:
            logger.error(f"SQLite get failed: {e}")
        return None

    def get_all(self) -> List[Dict[str, Any]]:
        try:
            with database.get_connection() as conn:
                rows = conn.execute("SELECT data_json FROM parcels ORDER BY created_at DESC").fetchall()
                return [json.loads(row["data_json"]) for row in rows]
        except Exception as e:
            logger.error(f"SQLite get_all failed: {e}")
            return []

    def delete(self, parcel_id: str, owner_uid: Optional[str] = None) -> bool:
        if owner_uid:
            existing = self.get(parcel_id)
            if existing and existing.get("ownerUid") and existing.get("ownerUid") != owner_uid:
                logger.warning(f"Permission denied for deleting SQLite parcel {parcel_id}")
                return False

        try:
            with database.get_connection() as conn:
                cursor = conn.execute("DELETE FROM parcels WHERE id = ?", (parcel_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"SQLite delete failed: {e}")
            return False

    def search(self, query: str) -> List[Dict[str, Any]]:
        # Reuse robust SQLite full-text scan logic
        return database.search_parcels_db(query)


class MongoPropertyRepository(PropertyRepository):
    def _get_collection(self):
        db = mongodb.get_mongodb_db()
        if db is None:
            raise ConnectionError("MongoDB Atlas database is not connected")
        return db.properties

    def save(self, parcel: Dict[str, Any], owner_uid: Optional[str] = None) -> bool:
        parcel_id = parcel.get("id")
        try:
            coll = self._get_collection()
            
            # Prepare document
            doc = dict(parcel)
            doc["_id"] = parcel_id
            
            # Handle timestamps and provider details
            now_iso = datetime.datetime.utcnow().isoformat() + "Z"
            doc["metadata"] = {
                "source": "generated",
                "storageProvider": "mongodb",
                "createdAt": parcel.get("metadata", {}).get("createdAt", now_iso),
                "updatedAt": now_iso
            }

            # Check existing ownership first if owner_uid is supplied
            if owner_uid:
                existing = coll.find_one({"_id": parcel_id})
                if existing and existing.get("ownerUid") and existing.get("ownerUid") != owner_uid:
                    logger.warning(f"Permission denied for updating Mongo parcel {parcel_id}")
                    return False
                doc["ownerUid"] = owner_uid
            elif "ownerUid" in parcel:
                doc["ownerUid"] = parcel["ownerUid"]

            coll.replace_one({"_id": parcel_id}, doc, upsert=True)
            return True
        except Exception as e:
            logger.error(f"MongoDB save failed: {e}")
            return False

    def get(self, parcel_id: str) -> Optional[Dict[str, Any]]:
        try:
            coll = self._get_collection()
            doc = coll.find_one({"_id": parcel_id})
            if doc:
                # Remove MongoDB internal _id before returning
                doc.pop("_id", None)
                return doc
        except Exception as e:
            logger.error(f"MongoDB get failed: {e}")
        return None

    def get_all(self) -> List[Dict[str, Any]]:
        try:
            coll = self._get_collection()
            cursor = coll.find({}).sort("metadata.createdAt", -1)
            results = []
            for doc in cursor:
                doc.pop("_id", None)
                results.append(doc)
            return results
        except Exception as e:
            logger.error(f"MongoDB get_all failed: {e}")
            return []

    def delete(self, parcel_id: str, owner_uid: Optional[str] = None) -> bool:
        try:
            coll = self._get_collection()
            
            if owner_uid:
                existing = coll.find_one({"_id": parcel_id})
                if existing and existing.get("ownerUid") and existing.get("ownerUid") != owner_uid:
                    logger.warning(f"Permission denied for deleting Mongo parcel {parcel_id}")
                    return False
            
            res = coll.delete_one({"_id": parcel_id})
            return res.deleted_count > 0
        except Exception as e:
            logger.error(f"MongoDB delete failed: {e}")
            return False

    def search(self, query: str) -> List[Dict[str, Any]]:
        try:
            coll = self._get_collection()
            q = {"$regex": query, "$options": "i"}
            # Query label or ID
            filter_query = {
                "$or": [
                    {"id": q},
                    {"label": q},
                    {"buildings.id": q},
                    {"buildings.label": q},
                    {"buildings.floors.id": q},
                    {"buildings.floors.label": q},
                    {"buildings.floors.owner": q},
                    {"buildings.floors.useType": q},
                    {"buildings.floors.ulpin.code": q}
                ]
            }
            cursor = coll.find(filter_query)
            results = []
            for doc in cursor:
                doc.pop("_id", None)
                results.append(doc)
            return results
        except Exception as e:
            logger.error(f"MongoDB search failed: {e}")
            # Fallback to empty
            return []

# Resolver instances
_mongo_repo = MongoPropertyRepository()
_sqlite_repo = SQLitePropertyRepository()

def get_repository() -> PropertyRepository:
    provider = os.environ.get("DATABASE_PROVIDER", "sqlite").lower()
    if provider == "mongodb":
        if mongodb.is_mongodb_connected():
            return _mongo_repo
        else:
            logger.warning("MongoDB selected but unavailable. Falling back to SQLite.")
            return _sqlite_repo
    return _sqlite_repo

def get_repository_status() -> dict:
    provider = os.environ.get("DATABASE_PROVIDER", "sqlite").lower()
    if provider == "mongodb":
        if mongodb.is_mongodb_connected():
            return {
                "database": "mongodb",
                "databaseStatus": "connected"
            }
        else:
            return {
                "database": "sqlite",
                "databaseStatus": "fallback"
            }
    return {
        "database": "sqlite",
        "databaseStatus": "connected"
    }
