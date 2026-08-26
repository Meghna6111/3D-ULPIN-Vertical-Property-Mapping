"""
3D Spatial Topology & Volumetric Collision Validator
Enforces zero topological errors for vertical strata property registration.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any, Tuple
from db.models import Parcel3DRecord, BoundingBox3DData

EPSILON = 1e-4

@dataclass
class EncroachmentIssue:
    issue_type: str  # '3D_VOLUMETRIC_COLLISION', 'AIR_RIGHTS_ENCROACHMENT', 'BOUNDARY_PROJECTION_OVERFLOW'
    severity: str    # 'CRITICAL', 'WARNING'
    conflicting_ulpin: str
    conflicting_owner: str
    conflicting_unit: str
    intersection_volume_m3: float
    description: str

@dataclass
class TopologyValidationReport:
    is_valid: bool
    total_conflicts: int
    checked_parcel_count: int
    issues: List[EncroachmentIssue] = field(default_factory=list)
    air_rights_compliant: bool = True
    ground_boundary_contained: bool = True
    summary: str = "Topology check passed without conflicts."

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "total_conflicts": self.total_conflicts,
            "checked_parcel_count": self.checked_parcel_count,
            "air_rights_compliant": self.air_rights_compliant,
            "ground_boundary_contained": self.ground_boundary_contained,
            "summary": self.summary,
            "issues": [
                {
                    "issue_type": i.issue_type,
                    "severity": i.severity,
                    "conflicting_ulpin": i.conflicting_ulpin,
                    "conflicting_owner": i.conflicting_owner,
                    "conflicting_unit": i.conflicting_unit,
                    "intersection_volume_m3": i.intersection_volume_m3,
                    "description": i.description,
                }
                for i in self.issues
            ]
        }

def check_3d_collision(b1: BoundingBox3DData, b2: BoundingBox3DData, eps: float = EPSILON) -> bool:
    """Checks whether two 3D bounding boxes intersect in 3D space."""
    x_overlap = (b1.min_x < b2.max_x - eps) and (b1.max_x > b2.min_x + eps)
    y_overlap = (b1.min_y < b2.max_y - eps) and (b1.max_y > b2.min_y + eps)
    z_overlap = (b1.min_z < b2.max_z - eps) and (b1.max_z > b2.min_z + eps)
    return x_overlap and y_overlap and z_overlap

def compute_3d_intersection_volume(b1: BoundingBox3DData, b2: BoundingBox3DData) -> float:
    """Computes the exact volumetric overlap between two 3D bounding boxes in m³."""
    ix_min = max(b1.min_x, b2.min_x)
    ix_max = min(b1.max_x, b2.max_x)
    iy_min = max(b1.min_y, b2.min_y)
    iy_max = min(b1.max_y, b2.max_y)
    iz_min = max(b1.min_z, b2.min_z)
    iz_max = min(b1.max_z, b2.max_z)

    if ix_min < ix_max and iy_min < iy_max and iz_min < iz_max:
        dx = ix_max - ix_min
        dy = iy_max - iy_min
        dz = iz_max - iz_min
        return round(dx * dy * dz, 3)
    return 0.0

class TopologyValidator:
    def __init__(self, ground_boundary: Optional[Dict[str, float]] = None):
        # Optional ground parcel envelope constraint
        self.ground_boundary = ground_boundary or {
            "min_x": -15.0, "max_x": 15.0,
            "min_y": -15.0, "max_y": 15.0
        }

    def validate_candidate(
        self,
        candidate_bounds: BoundingBox3DData,
        candidate_floor: int,
        existing_parcels: List[Parcel3DRecord],
        exclude_ulpin: Optional[str] = None
    ) -> TopologyValidationReport:
        issues: List[EncroachmentIssue] = []
        air_rights_ok = True
        boundary_ok = True

        # 1. Check ground boundary projection containment (no building overhang outside lot)
        gb = self.ground_boundary
        if (
            candidate_bounds.min_x < gb["min_x"] - EPSILON or
            candidate_bounds.max_x > gb["max_x"] + EPSILON or
            candidate_bounds.min_y < gb["min_y"] - EPSILON or
            candidate_bounds.max_y > gb["max_y"] + EPSILON
        ):
            boundary_ok = False
            issues.append(EncroachmentIssue(
                issue_type="BOUNDARY_PROJECTION_OVERFLOW",
                severity="CRITICAL",
                conflicting_ulpin="GROUND_CADASTRAL_LOT",
                conflicting_owner="Survey Department",
                conflicting_unit="Base Parcel Boundary",
                intersection_volume_m3=0.0,
                description=f"Candidate unit extends beyond base survey lot footprint ({gb['min_x']}m to {gb['max_x']}m X, {gb['min_y']}m to {gb['max_y']}m Y)"
            ))

        # 2. Check 3D collision against all registered parcels
        for existing in existing_parcels:
            if exclude_ulpin and existing.ulpin_3d == exclude_ulpin:
                continue

            if check_3d_collision(candidate_bounds, existing.bounds):
                vol = compute_3d_intersection_volume(candidate_bounds, existing.bounds)
                issue_type = "3D_VOLUMETRIC_COLLISION"
                desc = (
                    f"3D Encroachment: Overlaps by {vol} m³ with parcel {existing.ulpin_3d} "
                    f"({existing.unit_label}, Owner: {existing.owner_name}) on Floor {existing.floor_level}."
                )

                if candidate_floor != existing.floor_level:
                    issue_type = "AIR_RIGHTS_ENCROACHMENT"
                    air_rights_ok = False
                    desc = f"Vertical Air-Rights Encroachment: Unit on Floor {candidate_floor} breaches stratum boundary of Floor {existing.floor_level} (ULPIN: {existing.ulpin_3d})."

                issues.append(EncroachmentIssue(
                    issue_type=issue_type,
                    severity="CRITICAL",
                    conflicting_ulpin=existing.ulpin_3d,
                    conflicting_owner=existing.owner_name,
                    conflicting_unit=existing.unit_label,
                    intersection_volume_m3=vol,
                    description=desc
                ))

        is_valid = len(issues) == 0
        summary = (
            "Topology verification passed successfully. Zero 3D overlaps or air-rights violations."
            if is_valid
            else f"Topology verification failed with {len(issues)} conflicting encroachment(s)."
        )

        return TopologyValidationReport(
            is_valid=is_valid,
            total_conflicts=len(issues),
            checked_parcel_count=len(existing_parcels),
            issues=issues,
            air_rights_compliant=air_rights_ok,
            ground_boundary_contained=boundary_ok,
            summary=summary,
        )
