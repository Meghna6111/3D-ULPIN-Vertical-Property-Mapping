"""
Core 3D ULPIN and Spatial Topology Engine
"""
from .ulpin_engine import generate_3d_ulpin, parse_3d_ulpin, SpatialCoordinates3D
from .topology_validator import (
    TopologyValidator,
    TopologyValidationReport,
    EncroachmentIssue,
    check_3d_collision,
    compute_3d_intersection_volume,
)

__all__ = [
    "generate_3d_ulpin",
    "parse_3d_ulpin",
    "SpatialCoordinates3D",
    "TopologyValidator",
    "TopologyValidationReport",
    "EncroachmentIssue",
    "check_3d_collision",
    "compute_3d_intersection_volume",
]
