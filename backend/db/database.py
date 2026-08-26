"""
Database Connection Manager and Storage Layer
Supports PostgreSQL / PostGIS with automatic SQLite fallback for standalone local execution.
Includes schema migration for demographics, utility analytics, and 19-char 3D ULPIN.
"""
import os
import sqlite3
import json
import time
from typing import List, Optional, Dict, Any
from .models import Parcel3DRecord, BoundingBox3DData

DB_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "cadastre_3d.db")

class DBManager:
    def __init__(self, db_path: str = DB_FILE_PATH):
        self.db_path = db_path
        self.use_mongo = False
        self.mongo_client = None
        self.db = None
        self.collection = None
        
        # Load environment configuration
        self._init_mongodb()
        self._init_sqlite()
        self._migrate_sqlite_to_mongodb()

    def _init_mongodb(self):
        """Initializes connection to MongoDB Atlas if URI is present in environment/dotenv."""
        mongo_uri = os.environ.get("MONGODB_URI")
        if not mongo_uri:
            # Check dotenv files
            for path in [".env", "../.env", "../../.env", "backend/.env"]:
                if os.path.exists(path):
                    try:
                        with open(path, "r") as f:
                            for line in f:
                                line = line.strip()
                                if line and not line.startswith("#") and "=" in line:
                                    parts = line.split("=", 1)
                                    if parts[0].strip() == "MONGODB_URI":
                                        mongo_uri = parts[1].strip()
                                        break
                    except Exception:
                        pass
                    if mongo_uri:
                        break

        # Check if the user hasn't replaced the placeholder
        if mongo_uri and "<db_password>" in mongo_uri:
            print("MongoDB Atlas: <db_password> placeholder not replaced yet. Defaulting to SQLite.")
            return

        if mongo_uri:
            try:
                from pymongo import MongoClient
                # Quick connection validation with a 3 second timeout
                self.mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
                self.mongo_client.server_info()  # Forces connection test
                self.db = self.mongo_client["sih_cadastre"]
                self.collection = self.db["parcels_3d"]
                self.use_mongo = True
                print("MongoDB Atlas: Successfully connected to cluster!")
            except Exception as e:
                print(f"MongoDB Atlas connection failed: {e}. Falling back to SQLite.")
                self.use_mongo = False

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        """Initializes SQLite schema mirroring PostGIS 3D structure and migrates columns."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS parcels_3d (
                    id TEXT PRIMARY KEY,
                    ulpin_3d TEXT UNIQUE NOT NULL,
                    base_survey_no TEXT NOT NULL,
                    base_plot_id TEXT DEFAULT '12A34B56C78D90',
                    state_code TEXT NOT NULL,
                    district_code TEXT NOT NULL,
                    floor_level INTEGER NOT NULL,
                    unit_label TEXT NOT NULL,
                    owner_name TEXT NOT NULL,
                    property_type TEXT NOT NULL,
                    volume_m3 REAL NOT NULL,
                    min_x REAL NOT NULL,
                    max_x REAL NOT NULL,
                    min_y REAL NOT NULL,
                    max_y REAL NOT NULL,
                    min_z REAL NOT NULL,
                    max_z REAL NOT NULL,
                    seniors_60plus INTEGER DEFAULT 0,
                    adults INTEGER DEFAULT 2,
                    infants_kids INTEGER DEFAULT 0,
                    total_occupants INTEGER DEFAULT 2,
                    electricity_kwh REAL DEFAULT 240.0,
                    water_liters REAL DEFAULT 9500.0,
                    declared_floors INTEGER DEFAULT 4,
                    actual_floors INTEGER DEFAULT 4,
                    metadata_json TEXT,
                    encumbrance_status TEXT,
                    created_at REAL NOT NULL
                );
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ulpin ON parcels_3d (ulpin_3d);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_floor ON parcels_3d (floor_level);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_zrange ON parcels_3d (min_z, max_z);")

            # Check for existing table schema columns and alter if needed
            cursor.execute("PRAGMA table_info(parcels_3d)")
            cols = {row["name"] for row in cursor.fetchall()}
            
            alterations = [
                ("base_plot_id", "TEXT DEFAULT '12A34B56C78D90'"),
                ("seniors_60plus", "INTEGER DEFAULT 0"),
                ("adults", "INTEGER DEFAULT 2"),
                ("infants_kids", "INTEGER DEFAULT 0"),
                ("total_occupants", "INTEGER DEFAULT 2"),
                ("electricity_kwh", "REAL DEFAULT 240.0"),
                ("water_liters", "REAL DEFAULT 9500.0"),
                ("declared_floors", "INTEGER DEFAULT 4"),
                ("actual_floors", "INTEGER DEFAULT 4"),
            ]
            for col_name, col_def in alterations:
                if col_name not in cols:
                    try:
                        cursor.execute(f"ALTER TABLE parcels_3d ADD COLUMN {col_name} {col_def}")
                    except Exception:
                        pass

            conn.commit()

    def _migrate_sqlite_to_mongodb(self):
        """If using MongoDB and the MongoDB collection is empty, migrate existing data from SQLite."""
        if not self.use_mongo or not self.collection:
            return
        
        try:
            mongo_count = self.collection.count_documents({})
            if mongo_count == 0:
                print("MongoDB Atlas is empty. Migrating existing parcels from SQLite database...")
                # Get all parcels from SQLite
                parcels_to_migrate = []
                with self._get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT * FROM parcels_3d")
                    rows = cursor.fetchall()
                    for r in rows:
                        # Convert SQLite row to Parcel3DRecord
                        try:
                            meta = json.loads(r["metadata_json"]) if r["metadata_json"] else {}
                        except Exception:
                            meta = {}
                        bounds = BoundingBox3DData(
                            min_x=r["min_x"], max_x=r["max_x"],
                            min_y=r["min_y"], max_y=r["max_y"],
                            min_z=r["min_z"], max_z=r["max_z"]
                        )
                        record = Parcel3DRecord(
                            id=r["id"],
                            ulpin_3d=r["ulpin_3d"],
                            base_survey_no=r["base_survey_no"],
                            base_plot_id=r["base_plot_id"],
                            state_code=r["state_code"],
                            district_code=r["district_code"],
                            floor_level=r["floor_level"],
                            unit_label=r["unit_label"],
                            owner_name=r["owner_name"],
                            property_type=r["property_type"],
                            volume_m3=r["volume_m3"],
                            bounds=bounds,
                            seniors_60plus=r["seniors_60plus"],
                            adults=r["adults"],
                            infants_kids=r["infants_kids"],
                            total_occupants=r["total_occupants"],
                            electricity_kwh=r["electricity_kwh"],
                            water_liters=r["water_liters"],
                            declared_floors=r["declared_floors"],
                            actual_floors=r["actual_floors"],
                            metadata_json=meta,
                            encumbrance_status=r["encumbrance_status"],
                            created_at=r["created_at"]
                        )
                        parcels_to_migrate.append(self._parcel_to_doc(record))
                
                if parcels_to_migrate:
                    self.collection.insert_many(parcels_to_migrate)
                    print(f"Successfully migrated {len(parcels_to_migrate)} parcels from SQLite to MongoDB Atlas!")
        except Exception as e:
            print(f"Error during SQLite to MongoDB migration: {e}")

    def _parcel_to_doc(self, parcel: Parcel3DRecord) -> dict:
        doc = parcel.to_dict()
        doc["_id"] = parcel.id
        return doc

    def _doc_to_parcel(self, doc: dict) -> Parcel3DRecord:
        bounds_data = doc.get("bounds", {})
        bounds = BoundingBox3DData(
            min_x=bounds_data.get("min_x", 0.0),
            max_x=bounds_data.get("max_x", 1.0),
            min_y=bounds_data.get("min_y", 0.0),
            max_y=bounds_data.get("max_y", 1.0),
            min_z=bounds_data.get("min_z", 0.0),
            max_z=bounds_data.get("max_z", 3.0),
        )
        return Parcel3DRecord(
            id=doc.get("id"),
            ulpin_3d=doc.get("ulpin_3d", ""),
            base_survey_no=doc.get("base_survey_no", "SY-142/2A"),
            base_plot_id=doc.get("base_plot_id", "12A34B56C78D90"),
            state_code=doc.get("state_code", "KA"),
            district_code=doc.get("district_code", "560"),
            floor_level=doc.get("floor_level", 1),
            unit_label=doc.get("unit_label", "Flat-101"),
            owner_name=doc.get("owner_name", "Registered Citizen"),
            property_type=doc.get("property_type", "Residential Apartment"),
            volume_m3=doc.get("volume_m3", 0.0),
            bounds=bounds,
            seniors_60plus=doc.get("seniors_60plus", 0),
            adults=doc.get("adults", 2),
            infants_kids=doc.get("infants_kids", 0),
            total_occupants=doc.get("total_occupants", 2),
            electricity_kwh=doc.get("electricity_kwh", 240.0),
            water_liters=doc.get("water_liters", 9500.0),
            declared_floors=doc.get("declared_floors", 4),
            actual_floors=doc.get("actual_floors", 4),
            metadata_json=doc.get("metadata_json", {}),
            encumbrance_status=doc.get("encumbrance_status", "Clear / Validated"),
            created_at=doc.get("created_at", time.time()),
        )

    def insert_parcel(self, parcel: Parcel3DRecord) -> Parcel3DRecord:
        if self.use_mongo:
            try:
                doc = self._parcel_to_doc(parcel)
                self.collection.replace_one({"_id": parcel.id}, doc, upsert=True)
                return parcel
            except Exception as e:
                print(f"MongoDB insert failed: {e}. Falling back to SQLite.")

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO parcels_3d (
                    id, ulpin_3d, base_survey_no, base_plot_id, state_code, district_code,
                    floor_level, unit_label, owner_name, property_type, volume_m3,
                    min_x, max_x, min_y, max_y, min_z, max_z,
                    seniors_60plus, adults, infants_kids, total_occupants,
                    electricity_kwh, water_liters, declared_floors, actual_floors,
                    metadata_json, encumbrance_status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                parcel.id,
                parcel.ulpin_3d,
                parcel.base_survey_no,
                parcel.base_plot_id,
                parcel.state_code,
                parcel.district_code,
                parcel.floor_level,
                parcel.unit_label,
                parcel.owner_name,
                parcel.property_type,
                parcel.volume_m3,
                parcel.bounds.min_x,
                parcel.bounds.max_x,
                parcel.bounds.min_y,
                parcel.bounds.max_y,
                parcel.bounds.min_z,
                parcel.bounds.max_z,
                parcel.seniors_60plus,
                parcel.adults,
                parcel.infants_kids,
                parcel.total_occupants,
                parcel.electricity_kwh,
                parcel.water_liters,
                parcel.declared_floors,
                parcel.actual_floors,
                json.dumps(parcel.metadata_json),
                parcel.encumbrance_status,
                parcel.created_at,
            ))
            conn.commit()
        return parcel

    def get_all_parcels(self, floor_level: Optional[int] = None) -> List[Parcel3DRecord]:
        if self.use_mongo:
            try:
                query = {} if floor_level is None else {"floor_level": floor_level}
                docs = self.collection.find(query).sort([("floor_level", 1), ("unit_label", 1)])
                return [self._doc_to_parcel(d) for d in docs]
            except Exception as e:
                print(f"MongoDB query failed: {e}. Falling back to SQLite.")

        with self._get_connection() as conn:
            cursor = conn.cursor()
            if floor_level is not None:
                cursor.execute("SELECT * FROM parcels_3d WHERE floor_level = ? ORDER BY floor_level, unit_label", (floor_level,))
            else:
                cursor.execute("SELECT * FROM parcels_3d ORDER BY floor_level, unit_label")
            rows = cursor.fetchall()
            return [self._row_to_parcel(r) for r in rows]

    def get_parcel_by_ulpin(self, ulpin: str) -> Optional[Parcel3DRecord]:
        if self.use_mongo:
            try:
                doc = self.collection.find_one({"ulpin_3d": ulpin})
                return self._doc_to_parcel(doc) if doc else None
            except Exception as e:
                print(f"MongoDB find failed: {e}. Falling back to SQLite.")

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM parcels_3d WHERE ulpin_3d = ?", (ulpin,))
            row = cursor.fetchone()
            return self._row_to_parcel(row) if row else None

    def clear_all_parcels(self):
        if self.use_mongo:
            try:
                self.collection.delete_many({})
                return
            except Exception as e:
                print(f"MongoDB delete failed: {e}. Falling back to SQLite.")

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM parcels_3d")
            conn.commit()

    def count_parcels(self) -> int:
        if self.use_mongo:
            try:
                return self.collection.count_documents({})
            except Exception as e:
                print(f"MongoDB count failed: {e}. Falling back to SQLite.")

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM parcels_3d")
            return cursor.fetchone()[0]

    def _row_to_parcel(self, row: sqlite3.Row) -> Parcel3DRecord:
        bounds = BoundingBox3DData(
            min_x=row["min_x"],
            max_x=row["max_x"],
            min_y=row["min_y"],
            max_y=row["max_y"],
            min_z=row["min_z"],
            max_z=row["max_z"],
        )
        meta = json.loads(row["metadata_json"]) if row["metadata_json"] else {}
        keys = row.keys()
        base_plot = row["base_plot_id"] if "base_plot_id" in keys and row["base_plot_id"] else "12A34B56C78D90"
        seniors = row["seniors_60plus"] if "seniors_60plus" in keys and row["seniors_60plus"] is not None else 0
        adults = row["adults"] if "adults" in keys and row["adults"] is not None else 2
        infants = row["infants_kids"] if "infants_kids" in keys and row["infants_kids"] is not None else 0
        total_occ = row["total_occupants"] if "total_occupants" in keys and row["total_occupants"] is not None else (seniors + adults + infants)
        elec = row["electricity_kwh"] if "electricity_kwh" in keys and row["electricity_kwh"] is not None else 240.0
        water = row["water_liters"] if "water_liters" in keys and row["water_liters"] is not None else 9500.0
        decl_f = row["declared_floors"] if "declared_floors" in keys and row["declared_floors"] is not None else 4
        act_f = row["actual_floors"] if "actual_floors" in keys and row["actual_floors"] is not None else 4

        return Parcel3DRecord(
            id=row["id"],
            ulpin_3d=row["ulpin_3d"],
            base_survey_no=row["base_survey_no"],
            base_plot_id=base_plot,
            state_code=row["state_code"],
            district_code=row["district_code"],
            floor_level=row["floor_level"],
            unit_label=row["unit_label"],
            owner_name=row["owner_name"],
            property_type=row["property_type"],
            volume_m3=row["volume_m3"],
            bounds=bounds,
            seniors_60plus=seniors,
            adults=adults,
            infants_kids=infants,
            total_occupants=total_occ,
            electricity_kwh=elec,
            water_liters=water,
            declared_floors=decl_f,
            actual_floors=act_f,
            metadata_json=meta,
            encumbrance_status=row["encumbrance_status"] or "Clear / Validated",
            created_at=row["created_at"],
        )

# Global database singleton
_db_instance: Optional[DBManager] = None

def get_db() -> DBManager:
    global _db_instance
    if _db_instance is None:
        _db_instance = DBManager()
    return _db_instance

def init_db():
    get_db()
