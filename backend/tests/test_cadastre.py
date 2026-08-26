"""
Comprehensive Test Suite for SIH26011 3D ULPIN Cadastral System
Validates 19-char 3D ULPIN generation, spatial collision rejection, Vision AI blueprint extraction,
Scikit-Learn tax anomaly detection, Deed OCR, utility occupancy regression, property tax calculation,
NDRF disaster rescue mode, and REST API endpoints.
"""
import pytest
from fastapi.testclient import TestClient

from main import app
from db.database import get_db
from db.models import BoundingBox3DData, Parcel3DRecord
from core.ulpin_engine import (
    generate_19char_3d_ulpin,
    parse_19char_3d_ulpin,
    generate_3d_ulpin,
    parse_3d_ulpin,
)
from core.topology_validator import (
    TopologyValidator,
    check_3d_collision,
    compute_3d_intersection_volume,
)
from core.tax_calculator import PropertyTaxCalculator
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../ai-model')))

from vision_ai import BlueprintVisionAI
from tax_anomaly import TaxAnomalyDetector
from ocr_reader import DeedOcrReader
from utility_estimator import UtilityOccupancyEstimator
from lidar_processor import (
    LidarProcessor,
    generate_synthetic_building_points,
)

client = TestClient(app)

# -----------------------------------------------------------------------------
# 1. 19-Character 3D ULPIN Engine Tests (Pillar 1)
# -----------------------------------------------------------------------------

def test_19char_ulpin_format_positive_floor():
    base_plot = "12A34B56C78D90"
    ulpin = generate_19char_3d_ulpin(base_plot, 3)
    assert ulpin == "12A34B56C78D90-A003"
    assert len(ulpin) == 19

    parsed = parse_19char_3d_ulpin(ulpin)
    assert parsed["valid"] is True
    assert parsed["base_plot"] == "12A34B56C78D90"
    assert parsed["floor_level"] == 3
    assert parsed["is_subsurface"] is False

def test_19char_ulpin_format_ground_floor():
    base_plot = "12A34B56C78D90"
    ulpin = generate_19char_3d_ulpin(base_plot, 0)
    assert ulpin == "12A34B56C78D90-A000"
    assert len(ulpin) == 19

    parsed = parse_19char_3d_ulpin(ulpin)
    assert parsed["valid"] is True
    assert parsed["floor_level"] == 0

def test_19char_ulpin_format_subsurface_basements():
    base_plot = "12A34B56C78D90"
    ulpin_b1 = generate_19char_3d_ulpin(base_plot, -1)
    assert ulpin_b1 == "12A34B56C78D90-B001"
    assert len(ulpin_b1) == 19

    ulpin_b2 = generate_19char_3d_ulpin(base_plot, -2)
    assert ulpin_b2 == "12A34B56C78D90-B002"

    parsed_b2 = parse_19char_3d_ulpin(ulpin_b2)
    assert parsed_b2["valid"] is True
    assert parsed_b2["floor_level"] == -2
    assert parsed_b2["is_subsurface"] is True

def test_iso_tokenized_ulpin_generation():
    bounds = BoundingBox3DData(min_x=0.0, max_x=10.0, min_y=0.0, max_y=10.0, min_z=6.4, max_z=9.6)
    ulpin = generate_3d_ulpin("KA", "560", 3, bounds)
    assert ulpin.startswith("IN-KA-560-F03-Z08-")
    parsed = parse_3d_ulpin(ulpin)
    assert parsed["valid"] is True
    assert parsed["state_code"] == "KA"
    assert parsed["district_code"] == "560"

# -----------------------------------------------------------------------------
# 2. 3D Spatial Collision & Topology Validation Tests (Pillar 1)
# -----------------------------------------------------------------------------

def test_3d_collision_detection():
    b1 = BoundingBox3DData(min_x=0.0, max_x=5.0, min_y=0.0, max_y=5.0, min_z=0.0, max_z=3.0)
    b2 = BoundingBox3DData(min_x=2.0, max_x=7.0, min_y=2.0, max_y=7.0, min_z=1.0, max_z=4.0)
    assert check_3d_collision(b1, b2) is True
    vol = compute_3d_intersection_volume(b1, b2)
    assert vol == pytest.approx((5.0 - 2.0) * (5.0 - 2.0) * (3.0 - 1.0))

def test_3d_adjacent_no_collision():
    b1 = BoundingBox3DData(min_x=0.0, max_x=5.0, min_y=0.0, max_y=5.0, min_z=0.0, max_z=3.0)
    b2 = BoundingBox3DData(min_x=5.0, max_x=10.0, min_y=0.0, max_y=5.0, min_z=0.0, max_z=3.0)
    assert check_3d_collision(b1, b2) is False

def test_topology_validator_rejection():
    validator = TopologyValidator(ground_boundary={"min_x": -10, "max_x": 10, "min_y": -10, "max_y": 10})
    existing_parcel = Parcel3DRecord(
        ulpin_3d="12A34B56C78D90-A001",
        floor_level=1,
        unit_label="Unit-101",
        owner_name="Test Citizen",
        bounds=BoundingBox3DData(min_x=0, max_x=4, min_y=0, max_y=4, min_z=0, max_z=3.2)
    )

    candidate_overlap = BoundingBox3DData(min_x=2, max_x=6, min_y=2, max_y=6, min_z=1, max_z=4)
    report = validator.validate_candidate(candidate_overlap, candidate_floor=1, existing_parcels=[existing_parcel])
    assert report.is_valid is False
    assert report.total_conflicts > 0

# -----------------------------------------------------------------------------
# 3. Vision AI Blueprint Extrusion Tests (Pillar 2)
# -----------------------------------------------------------------------------

def test_blueprint_vision_ai_synthetic_extraction():
    vision = BlueprintVisionAI(pixels_per_meter=40.0)
    res = vision.extract_sample_blueprint(base_plot_id="12A34B56C78D90", target_floor=3)
    assert res.ulpin_3d == "12A34B56C78D90-A003"
    assert res.target_floor == 3
    assert res.detected_contour_points >= 4
    assert res.carpet_area_sqm > 50.0
    assert res.volume_m3 > 150.0
    assert res.confidence_score >= 0.95

# -----------------------------------------------------------------------------
# 4. Tax Anomaly & Illegal Floor Detection Tests (Pillar 2)
# -----------------------------------------------------------------------------

def test_tax_anomaly_detector_fraud_and_compliance():
    detector = TaxAnomalyDetector()
    
    # Normal compliant building
    comp_report = detector.audit_complex("12A34B56C78D90", declared_floors=4, physical_floors=4, declared_volume_m3=1500, physical_volume_m3=1500)
    assert comp_report.risk_level == "COMPLIANT"
    assert comp_report.unpermitted_floors_count == 0

    # Fraudulent vertical extension (5 floors constructed vs 3 declared)
    fraud_report = detector.audit_complex("12A34B56C78D90", declared_floors=3, physical_floors=5, declared_volume_m3=1150, physical_volume_m3=1920)
    assert fraud_report.is_anomaly is True
    assert fraud_report.unpermitted_floors_count == 2
    assert fraud_report.risk_level == "CRITICAL_TAX_FRAUD"
    assert fraud_report.estimated_unpaid_tax_inr > 0

# -----------------------------------------------------------------------------
# 5. Deed OCR Document Extraction Tests (Pillar 2)
# -----------------------------------------------------------------------------

def test_deed_ocr_extraction():
    ocr = DeedOcrReader()
    res = ocr.parse_sample_deed()
    assert "Rajesh Sharma" in res.owner_name
    assert "302" in res.unit_label
    assert res.floor_level == 3
    assert "SY-142/2A" in res.survey_number
    assert res.suggested_19char_ulpin == "12A34B56C78D90-A003"

# -----------------------------------------------------------------------------
# 6. Smart Utility Occupancy Estimation Tests (Pillar 3)
# -----------------------------------------------------------------------------

def test_utility_occupancy_estimation():
    estimator = UtilityOccupancyEstimator()
    # High consumption indicating commercial / overcrowding
    res_high = estimator.estimate_occupants("12A34B56C78D90-A003", "Flat-301", electricity_kwh=850.0, water_liters=35000.0, declared_occupants=2)
    assert res_high.estimated_occupants >= 7
    assert res_high.anomaly_status == "OVERCROWDED_OR_COMMERCIAL"

    # Normal residential consumption
    res_norm = estimator.estimate_occupants("12A34B56C78D90-A001", "Flat-101", electricity_kwh=220.0, water_liters=9000.0, declared_occupants=3)
    assert res_norm.anomaly_status == "NORMAL"

# -----------------------------------------------------------------------------
# 7. Property Tax Calculation Tests (Pillar 4)
# -----------------------------------------------------------------------------

def test_property_tax_calculation_formulas():
    calc = PropertyTaxCalculator(residential_base_rate=45.0, commercial_base_rate=85.0)
    
    # Residential Unit on Floor 3
    res_tax = calc.calculate_tax(
        ulpin_3d="12A34B56C78D90-A003",
        unit_label="Flat-301",
        volume_m3=100.0,
        floor_level=3,
        property_type="Residential Apartment",
        has_senior_resident=True
    )
    # Floor 3 multiplier = 1.0 + (3-1)*0.035 = 1.07
    # Base = 100 * 45 * 1.07 = 4815, rebate 5% = 240.75, net = 4574.25
    assert res_tax.floor_multiplier == pytest.approx(1.07, rel=1e-2)
    assert res_tax.rebate_inr > 0
    assert res_tax.net_annual_tax_inr < res_tax.gross_annual_tax_inr

# -----------------------------------------------------------------------------
# 8. REST API Endpoint Integration Tests (Pillars 1 - 5)
# -----------------------------------------------------------------------------

def test_api_seed_complex_and_list_parcels():
    res = client.post("/api/seed-complex")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["base_plot_id"] == "12A34B56C78D90"
    assert data["total_registered"] >= 16

    list_res = client.get("/api/parcels")
    assert list_res.status_code == 200
    parcels = list_res.json()
    assert len(parcels) >= 16

    # Verify 19-char 3D ULPIN presence
    has_19char = any(p["ulpin_3d"].startswith("12A34B56C78D90-") for p in parcels)
    assert has_19char is True

def test_api_vision_ai_extract_endpoint():
    res = client.post("/api/vision/extract-blueprint?base_plot_id=12A34B56C78D90&target_floor=3&auto_register=true")
    assert res.status_code == 200
    data = res.json()
    assert data["ulpin_3d"] == "12A34B56C78D90-A003"
    assert data["carpet_area_sqm"] > 0
    assert data["volume_m3"] > 0

def test_api_tax_anomaly_endpoint():
    payload = {
        "base_plot_id": "12A34B56C78D90",
        "declared_floors": 3,
        "physical_floors": 5,
        "declared_volume_m3": 1150.0,
        "physical_volume_m3": 1920.0
    }
    res = client.post("/api/ai/tax-anomaly", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "CRITICAL_TAX_FRAUD"
    assert data["unpermitted_floors_count"] == 2

def test_api_deed_ocr_endpoint():
    res = client.post("/api/ai/extract-deed")
    assert res.status_code == 200
    data = res.json()
    assert "Rajesh Sharma" in data["owner_name"]
    assert data["floor_level"] == 3

def test_api_utility_estimator_endpoint():
    payload = {
        "ulpin_3d": "12A34B56C78D90-A003",
        "unit_label": "Flat-301",
        "electricity_kwh": 850.0,
        "water_liters": 32000.0,
        "declared_occupants": 2
    }
    res = client.post("/api/ai/estimate-occupancy", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["estimated_occupants"] >= 6
    assert data["anomaly_status"] == "OVERCROWDED_OR_COMMERCIAL"

def test_api_property_tax_endpoint():
    res = client.get("/api/tax/calculate/12A34B56C78D90-A003")
    assert res.status_code == 200
    data = res.json()
    assert "gross_annual_tax_inr" in data
    assert "net_annual_tax_inr" in data

def test_api_ndrf_rescue_summary_endpoint():
    res = client.get("/api/ndrf/rescue-summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_floors"] > 0
    assert data["total_seniors_trapped"] >= 0
    assert data["total_infants_trapped"] >= 0
    assert len(data["floors"]) > 0

def test_api_3d_spatial_exports():
    list_res = client.get("/api/parcels")
    first_ulpin = list_res.json()[0]["ulpin_3d"]

    # GeoJSON-3D
    geo_res = client.get(f"/api/parcel/{first_ulpin}/3d?format=geojson")
    assert geo_res.status_code == 200
    assert "FeatureCollection" in geo_res.text

    # CityGML
    city_res = client.get(f"/api/parcel/{first_ulpin}/3d?format=citygml")
    assert city_res.status_code == 200
    assert "CityModel" in city_res.text

    # glTF
    gltf_res = client.get(f"/api/parcel/{first_ulpin}/3d?format=gltf")
    assert gltf_res.status_code == 200
    assert "asset" in gltf_res.json()
