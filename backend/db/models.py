"""
Data Models and Database Entity Definitions for 3D ULPIN Cadastre
Conforms to ISO 19152 Land Administration Domain Model (LADM) Spatial Unit 3D Profile.
Extended with Demographics, Utility Tracking, and 19-Character 3D ULPIN.
"""
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional
import uuid
import time

@dataclass
class BoundingBox3DData:
    min_x: float
    max_x: float
    min_y: float
    max_y: float
    min_z: float
    max_z: float

    @property
    def width(self) -> float:
        return abs(self.max_x - self.min_x)

    @property
    def depth(self) -> float:
        return abs(self.max_y - self.min_y)

    @property
    def height(self) -> float:
        return abs(self.max_z - self.min_z)

    @property
    def volume(self) -> float:
        return round(self.width * self.depth * self.height, 3)

    @property
    def centroid(self) -> tuple:
        return (
            (self.min_x + self.max_x) / 2.0,
            (self.min_y + self.max_y) / 2.0,
            (self.min_z + self.max_z) / 2.0,
        )

    def to_dict(self) -> Dict[str, float]:
        return asdict(self)

    def get_polyhedral_vertices(self) -> List[List[float]]:
        """Returns the 8 3D corner coordinates of the volumetric parcel box."""
        return [
            [self.min_x, self.min_y, self.min_z],
            [self.max_x, self.min_y, self.min_z],
            [self.max_x, self.max_y, self.min_z],
            [self.min_x, self.max_y, self.min_z],
            [self.min_x, self.min_y, self.max_z],
            [self.max_x, self.min_y, self.max_z],
            [self.max_x, self.max_y, self.max_z],
            [self.min_x, self.max_y, self.max_z],
        ]

@dataclass
class Parcel3DRecord:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    ulpin_3d: str = ""
    base_survey_no: str = "SY-142/2A"
    base_plot_id: str = "12A34B56C78D90"
    state_code: str = "KA"
    district_code: str = "560"
    floor_level: int = 1
    unit_label: str = "Flat-101"
    owner_name: str = "Registered Citizen"
    property_type: str = "Residential Apartment"
    volume_m3: float = 0.0
    bounds: BoundingBox3DData = field(default_factory=lambda: BoundingBox3DData(0, 1, 0, 1, 0, 3))
    
    # Demographics & Safety Profile
    seniors_60plus: int = 0
    adults: int = 2
    infants_kids: int = 0
    total_occupants: int = 2
    
    # Utilities
    electricity_kwh: float = 240.0
    water_liters: float = 9500.0
    
    # Building Audit
    declared_floors: int = 4
    actual_floors: int = 4

    metadata_json: Dict[str, Any] = field(default_factory=dict)
    encumbrance_status: str = "Clear / Validated"
    created_at: float = field(default_factory=time.time)

    @property
    def is_vulnerable_for_rescue(self) -> bool:
        """Flags units with high-risk vulnerable residents (seniors >= 1 or infants >= 1)."""
        return (self.seniors_60plus > 0) or (self.infants_kids > 0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "ulpin_3d": self.ulpin_3d,
            "base_survey_no": self.base_survey_no,
            "base_plot_id": self.base_plot_id,
            "state_code": self.state_code,
            "district_code": self.district_code,
            "floor_level": self.floor_level,
            "unit_label": self.unit_label,
            "owner_name": self.owner_name,
            "property_type": self.property_type,
            "volume_m3": self.volume_m3,
            "bounds": self.bounds.to_dict(),
            "seniors_60plus": self.seniors_60plus,
            "adults": self.adults,
            "infants_kids": self.infants_kids,
            "total_occupants": self.total_occupants,
            "electricity_kwh": self.electricity_kwh,
            "water_liters": self.water_liters,
            "declared_floors": self.declared_floors,
            "actual_floors": self.actual_floors,
            "is_vulnerable_for_rescue": self.is_vulnerable_for_rescue,
            "metadata_json": self.metadata_json,
            "encumbrance_status": self.encumbrance_status,
            "created_at": self.created_at,
        }
