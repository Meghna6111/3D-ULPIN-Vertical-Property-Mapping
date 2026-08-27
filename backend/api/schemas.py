"""
Pydantic Schemas for 3D ULPIN Cadastral REST API
Covers GIS Spatial units, Demographics, NDRF Disaster Rescue, AI Vision, Tax Fraud, Deed OCR, and Utility Estimation.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class BoundingBox3DSchema(BaseModel):
    min_x: float = Field(..., description="Easting / Local X min in meters")
    max_x: float = Field(..., description="Easting / Local X max in meters")
    min_y: float = Field(..., description="Northing / Local Y min in meters")
    max_y: float = Field(..., description="Northing / Local Y max in meters")
    min_z: float = Field(..., description="Elevation MSL Z min in meters")
    max_z: float = Field(..., description="Elevation MSL Z max in meters")

class ParcelCreateSchema(BaseModel):
    state_code: str = Field("KA", description="2-letter State code (e.g. KA, MH, DL)")
    district_code: str = Field("560", description="3-digit District code")
    base_plot_id: Optional[str] = Field("12A34B56C78D90", description="14-char base cadastral parcel ID")
    floor_level: int = Field(..., description="Floor number (>0 for floors, <0 for basements, 0 for ground)")
    unit_label: str = Field(..., description="Unit identifier (e.g. Flat-302, Penthouse-A)")
    owner_name: str = Field(..., description="Full legal name of title holder")
    base_survey_no: str = Field("SY-142/2A", description="Underlying 2D cadastral land parcel survey number")
    property_type: Optional[str] = Field("Residential Apartment", description="Cadastral classification")
    bounds: BoundingBox3DSchema
    seniors_60plus: Optional[int] = Field(0, description="Senior citizens (>= 60 years)")
    adults: Optional[int] = Field(2, description="Adult occupants")
    infants_kids: Optional[int] = Field(0, description="Infants and kids (<12 years)")
    total_occupants: Optional[int] = Field(2, description="Total family members")
    electricity_kwh: Optional[float] = Field(240.0, description="Monthly electricity kWh")
    water_liters: Optional[float] = Field(9500.0, description="Monthly water liters")
    declared_floors: Optional[int] = Field(4, description="Declared floors in permit")
    actual_floors: Optional[int] = Field(4, description="Actual physical floors")
    metadata_json: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ParcelResponseSchema(BaseModel):
    id: str
    ulpin_3d: str
    base_survey_no: str
    base_plot_id: str
    state_code: str
    district_code: str
    floor_level: int
    unit_label: str
    owner_name: str
    property_type: str
    volume_m3: float
    bounds: BoundingBox3DSchema
    seniors_60plus: int
    adults: int
    infants_kids: int
    total_occupants: int
    electricity_kwh: float
    water_liters: float
    declared_floors: int
    actual_floors: int
    is_vulnerable_for_rescue: bool
    metadata_json: Dict[str, Any]
    encumbrance_status: str
    created_at: float

class EncroachmentIssueSchema(BaseModel):
    issue_type: str
    severity: str
    conflicting_ulpin: str
    conflicting_owner: str
    conflicting_unit: str
    intersection_volume_m3: float
    description: str

class TopologyValidationReportSchema(BaseModel):
    is_valid: bool
    total_conflicts: int
    checked_parcel_count: int
    air_rights_compliant: bool
    ground_boundary_contained: bool
    summary: str
    issues: List[EncroachmentIssueSchema]

class FloorStratumSchema(BaseModel):
    floor_level: int
    min_z: float
    max_z: float
    height_m: float
    point_count: int
    estimated_units: int
    bounds: BoundingBox3DSchema

class LidarIngestResponseSchema(BaseModel):
    total_points: int
    ground_points: int
    building_points: int
    detected_floors: int
    ground_elevation_msl: float
    building_height_m: float
    quality_metrics: Dict[str, float]
    strata: List[FloorStratumSchema]
    draft_parcels_registered: int

# AI & Demographics Schemas

class BlueprintExtractionRequestSchema(BaseModel):
    base_plot_id: Optional[str] = "12A34B56C78D90"
    target_floor: Optional[int] = 3
    floor_height: Optional[float] = 3.2

class TaxAnomalyAuditRequestSchema(BaseModel):
    base_plot_id: Optional[str] = "12A34B56C78D90"
    declared_floors: Optional[int] = 3
    physical_floors: Optional[int] = 5
    declared_volume_m3: Optional[float] = 1150.0
    physical_volume_m3: Optional[float] = 1920.0

class DeedExtractRequestSchema(BaseModel):
    deed_text: Optional[str] = None
    base_plot_id: Optional[str] = "12A34B56C78D90"

class UtilityEstimateRequestSchema(BaseModel):
    ulpin_3d: Optional[str] = "12A34B56C78D90-A003"
    unit_label: Optional[str] = "Flat-301"
    electricity_kwh: float = 850.0
    water_liters: float = 32000.0
    declared_occupants: int = 2

class NDRFFloorSummarySchema(BaseModel):
    floor_level: int
    floor_label: str
    total_units: int
    vulnerable_units: int
    seniors_count: int
    infants_kids_count: int
    total_trapped_occupants: int
    is_high_risk: bool
    units: List[Dict[str, Any]]

class NDRFRescueSummarySchema(BaseModel):
    total_floors: int
    total_vulnerable_floors: int
    total_seniors_trapped: int
    total_infants_trapped: int
    total_occupants: int
    incident_commander_alert: str
    floors: List[NDRFFloorSummarySchema]
# -------------------------------------------------------------------------
# 3D ULPIN Encode / Decode Schemas
# -------------------------------------------------------------------------

class ULPINEncodeRequestSchema(BaseModel):
    base_plot_id: str = Field(
        ...,
        description="14-character base cadastral plot ID"
    )
    floor_level: int = Field(
        ...,
        description="Floor level: 0=Ground, positive=Floor, negative=Basement"
    )
    elevation_msl: float = Field(
        ...,
        description="Elevation above mean sea level in meters"
    )


class ULPINEncodeResponseSchema(BaseModel):
    canonical_ulpin: str
    extended_3d_ulpin: str
    base_plot_id: str
    floor_level: int
    elevation_msl: float
    canonical_length: int


class ULPINDecodeResponseSchema(BaseModel):
    valid: bool
    ulpin_3d: Optional[str] = None
    base_plot_id: Optional[str] = None
    floor_level: Optional[int] = None
    floor_tag: Optional[str] = None
    is_subsurface: Optional[bool] = None
    error: Optional[str] = None