"""
Cryptographic 3D ULPIN (Unique Land Parcel Identification Number) Engine
Extended for Volumetric & Vertical Strata Units under ISO 19152 / DoLR Bhu-Aadhaar Guidelines.
"""
import hashlib
import re
from dataclasses import dataclass
from typing import Dict, Any, Optional

@dataclass
class SpatialCoordinates3D:
    min_x: float
    max_x: float
    min_y: float
    max_y: float
    min_z: float
    max_z: float

    @property
    def centroid_x(self) -> float:
        return (self.min_x + self.max_x) / 2.0

    @property
    def centroid_y(self) -> float:
        return (self.min_y + self.max_y) / 2.0

    @property
    def centroid_z(self) -> float:
        return (self.min_z + self.max_z) / 2.0


def format_floor_token(floor_level: int) -> str:
    """Formats floor level into standard cadastral layer tokens (e.g., F01, B02, G00)."""
    if floor_level > 0:
        return f"F{floor_level:02d}"
    elif floor_level < 0:
        return f"B{abs(floor_level):02d}"
    else:
        return "G00"


def format_elevation_token(z_msl: float) -> str:
    """Formats Mean Sea Level (MSL) elevation in meters into standardized Z token."""
    z_int = int(round(z_msl))
    if z_int >= 0:
        return f"Z{z_int:02d}"
    else:
        return f"ZNEG{abs(z_int):02d}"


def generate_19char_3d_ulpin(base_plot: str, floor_level: int) -> str:
    """
    Generates a 19-character 3D ULPIN identifier adhering to Ministry of Rural Development specifications:
    Format: <14-Digit-Base-Plot>-<FloorTag> (Total: 14 + 1 + 4 = 19 characters)
    
    Positive / Above-Ground Floors:
      Floor 3 -> 12A34B56C78D90-A003
      Floor 0 (Ground) -> 12A34B56C78D90-A000
    
    Subsurface Basements:
      Basement -1 -> 12A34B56C78D90-B001
      Basement -2 -> 12A34B56C78D90-B002
    """
    clean_base = re.sub(r"[^A-Za-z0-9]", "", base_plot).upper()
    if len(clean_base) < 14:
        # Pad deterministically to 14 alphanumeric characters
        clean_base = clean_base.ljust(14, "0")
    elif len(clean_base) > 14:
        clean_base = clean_base[:14]

    if floor_level >= 0:
        floor_tag = f"A{floor_level:03d}"
    else:
        floor_tag = f"B{abs(floor_level):03d}"

    return f"{clean_base}-{floor_tag}"


def parse_19char_3d_ulpin(ulpin: str) -> Dict[str, Any]:
    """Parses a 19-character 3D ULPIN string into base plot and floor level."""
    cleaned = ulpin.strip().upper()
    parts = cleaned.split("-")
    if len(parts) != 2 or len(cleaned) != 19 or len(parts[0]) != 14 or len(parts[1]) != 4:
        return {"valid": False, "error": "Invalid 19-character 3D ULPIN format"}

    base_plot = parts[0]
    tag = parts[1]
    prefix = tag[0]
    try:
        level_num = int(tag[1:])
        floor_level = level_num if prefix == "A" else -level_num
        return {
            "valid": True,
            "base_plot": base_plot,
            "floor_tag": tag,
            "floor_level": floor_level,
            "is_subsurface": prefix == "B",
            "standard": "19-Char 3D Bhu-Aadhaar"
        }
    except ValueError:
        return {"valid": False, "error": "Malformed floor digits in ULPIN"}


def generate_3d_ulpin(
    state_code: str,
    district_code: str,
    floor_level: int,
    bounds: Any,
    token_len: int = 6
) -> str:
    """
    Generates a deterministic, collision-resistant 3D ULPIN identifier:
    IN-<State>-<District>-<Floor/Basement>-<Z_MSL>-<SHA256 Token>
    
    Example: IN-KA-560-F02-Z06-4A9B2E
    """
    # Extract bounds coordinates safely
    if hasattr(bounds, 'min_x'):
        min_x, max_x = float(bounds.min_x), float(bounds.max_x)
        min_y, max_y = float(bounds.min_y), float(bounds.max_y)
        min_z, max_z = float(bounds.min_z), float(bounds.max_z)
    elif isinstance(bounds, dict):
        min_x, max_x = float(bounds['min_x']), float(bounds['max_x'])
        min_y, max_y = float(bounds['min_y']), float(bounds['max_y'])
        min_z, max_z = float(bounds['min_z']), float(bounds['max_z'])
    else:
        raise ValueError("Invalid bounds format provided to 3D ULPIN generator")

    cx = (min_x + max_x) / 2.0
    cy = (min_y + max_y) / 2.0
    cz = (min_z + max_z) / 2.0

    state_clean = state_code.strip().upper()
    district_clean = district_code.strip().upper()
    floor_token = format_floor_token(floor_level)
    z_token = format_elevation_token(cz)

    # Deterministic spatial signature
    spatial_signature = f"{cx:.5f}:{cy:.5f}:{min_z:.2f}:{max_z:.2f}"
    hash_digest = hashlib.sha256(spatial_signature.encode("utf-8")).hexdigest()
    spatial_token = hash_digest[:token_len].upper()

    return f"IN-{state_clean}-{district_clean}-{floor_token}-{z_token}-{spatial_token}"


def parse_3d_ulpin(ulpin: str) -> Dict[str, Any]:
    """Parses either 19-char 3D ULPIN or ISO tokenized 3D ULPIN string."""
    cleaned = ulpin.strip()
    if "-" in cleaned and len(cleaned) == 19:
        p19 = parse_19char_3d_ulpin(cleaned)
        if p19.get("valid"):
            return p19

    parts = cleaned.split("-")
    if len(parts) < 6 or parts[0] != "IN":
        return {"valid": False, "error": "Malformed 3D ULPIN token format"}

    country = parts[0]
    state = parts[1]
    district = parts[2]
    floor_str = parts[3]
    z_str = parts[4]
    hash_token = parts[5]

    floor_level = 0
    if floor_str.startswith("F"):
        floor_level = int(floor_str[1:])
    elif floor_str.startswith("B"):
        floor_level = -int(floor_str[1:])
    elif floor_str == "G00":
        floor_level = 0

    return {
        "valid": True,
        "country": country,
        "state_code": state,
        "district_code": district,
        "floor_token": floor_str,
        "floor_level": floor_level,
        "z_token": z_str,
        "spatial_hash": hash_token,
    }
