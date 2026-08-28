import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DATABASE_PATH = os.environ.get("DATABASE_PATH", "properties.db")

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema."""
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS parcels (
                id          TEXT PRIMARY KEY,
                label       TEXT NOT NULL,
                longitude   REAL NOT NULL,
                latitude    REAL NOT NULL,
                land_area   REAL NOT NULL,
                status      TEXT NOT NULL DEFAULT 'verified',
                data_json   TEXT NOT NULL,
                created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_parcels_coords ON parcels(longitude, latitude)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_parcels_label ON parcels(label)")
        conn.commit()

def save_parcel(parcel: Dict[str, Any]) -> bool:
    """Saves or updates a parcel in the database."""
    parcel_id = parcel.get("id")
    label = parcel.get("label", "")
    longitude = parcel.get("longitude", 0.0)
    latitude = parcel.get("latitude", 0.0)
    land_area = parcel.get("landAreaSqft", 0.0)
    status = parcel.get("status", "verified")
    data_json = json.dumps(parcel)

    with get_connection() as conn:
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

def get_parcel(parcel_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single parcel by its ID."""
    with get_connection() as conn:
        row = conn.execute("SELECT data_json FROM parcels WHERE id = ?", (parcel_id,)).fetchone()
        if row:
            return json.loads(row["data_json"])
    return None

def get_all_parcels() -> List[Dict[str, Any]]:
    """Retrieves all parcels stored in the database."""
    with get_connection() as conn:
        rows = conn.execute("SELECT data_json FROM parcels ORDER BY created_at DESC").fetchall()
        return [json.loads(row["data_json"]) for row in rows]

def delete_parcel(parcel_id: str) -> bool:
    """Deletes a parcel from the database. Returns True if deleted, False otherwise."""
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM parcels WHERE id = ?", (parcel_id,))
        conn.commit()
        return cursor.rowcount > 0

def search_parcels_db(query: str) -> List[Dict[str, Any]]:
    """Searches for parcels by id, label, or sub-elements in the json data."""
    q = f"%{query.lower()}%"
    with get_connection() as conn:
        # Search by id or label first for speed
        rows = conn.execute("""
            SELECT data_json FROM parcels 
            WHERE lower(id) LIKE ? OR lower(label) LIKE ?
        """, (q, q)).fetchall()
        
        results = [json.loads(row["data_json"]) for row in rows]
        
        # If no fast matches, scan full json for sub-elements
        if not results:
            all_rows = conn.execute("SELECT data_json FROM parcels").fetchall()
            for r in all_rows:
                data = json.loads(r["data_json"])
                # check buildings and floors
                matched = False
                for bld in data.get("buildings", []):
                    if query.lower() in bld.get("id", "").lower() or query.lower() in bld.get("label", "").lower():
                        matched = True
                        break
                    for flr in bld.get("floors", []):
                        if (query.lower() in flr.get("id", "").lower() or 
                            query.lower() in flr.get("label", "").lower() or 
                            query.lower() in flr.get("useType", "").lower() or 
                            query.lower() in flr.get("owner", "").lower() or 
                            query.lower() in flr.get("ulpin", {}).get("code", "").lower()):
                            matched = True
                            break
                    if matched:
                        break
                if matched and data not in results:
                    results.append(data)
                    
        return results

# Auto-initialize database schema on import
init_db()
