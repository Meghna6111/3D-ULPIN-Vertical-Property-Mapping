"""
Volumetric Property Tax & Strata Valuation Engine
ISO 19152 LADM / Municipal Revenue System for 3D Cadastre.
"""
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class PropertyTaxAssessment:
    ulpin_3d: str
    unit_label: str
    property_type: str
    floor_level: int
    volume_m3: float
    base_rate_inr_per_m3: float
    floor_multiplier: float
    commercial_surcharge_inr: float
    gross_annual_tax_inr: float
    rebate_inr: float
    net_annual_tax_inr: float
    tax_breakdown: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ulpin_3d": self.ulpin_3d,
            "unit_label": self.unit_label,
            "property_type": self.property_type,
            "floor_level": self.floor_level,
            "volume_m3": round(self.volume_m3, 2),
            "base_rate_inr_per_m3": self.base_rate_inr_per_m3,
            "floor_multiplier": round(self.floor_multiplier, 3),
            "commercial_surcharge_inr": self.commercial_surcharge_inr,
            "gross_annual_tax_inr": round(self.gross_annual_tax_inr, 2),
            "rebate_inr": round(self.rebate_inr, 2),
            "net_annual_tax_inr": round(self.net_annual_tax_inr, 2),
            "tax_breakdown": self.tax_breakdown,
        }

class PropertyTaxCalculator:
    def __init__(
        self,
        residential_base_rate: float = 45.0, # INR per m3
        commercial_base_rate: float = 85.0,  # INR per m3
        infrastructure_base_rate: float = 20.0, # INR per m3
    ):
        self.residential_base_rate = residential_base_rate
        self.commercial_base_rate = commercial_base_rate
        self.infrastructure_base_rate = infrastructure_base_rate

    def calculate_tax(
        self,
        ulpin_3d: str,
        unit_label: str,
        volume_m3: float,
        floor_level: int,
        property_type: str = "Residential Apartment",
        has_senior_resident: bool = False,
    ) -> PropertyTaxAssessment:
        """
        Computes 3D Volumetric Property Tax:
        Annual Tax = Volume (m³) * Base Rate * Floor Multiplier + Commercial Surcharge
        """
        # 1. Base Rate by Property Type
        prop_clean = property_type.lower()
        if "commercial" in prop_clean or "penthouse" in prop_clean:
            base_rate = self.commercial_base_rate
            commercial_surcharge = 5000.0
        elif "infrastructure" in prop_clean or "public" in prop_clean or "metro" in prop_clean:
            base_rate = self.infrastructure_base_rate
            commercial_surcharge = 0.0
        else:
            base_rate = self.residential_base_rate
            commercial_surcharge = 0.0

        # 2. Strata Floor Multiplier
        if floor_level > 0:
            # Positive floor factor (slight appreciation with view & elevation: +3% per floor above G/F1)
            floor_multiplier = 1.0 + max(0, (floor_level - 1)) * 0.035
        elif floor_level < 0:
            # Basement deduction (utility / subterranean factor)
            floor_multiplier = max(0.65, 0.85 - abs(floor_level + 1) * 0.10)
        else:
            floor_multiplier = 1.0

        # 3. Base Volumetric Tax
        volumetric_tax = volume_m3 * base_rate * floor_multiplier
        gross_tax = volumetric_tax + commercial_surcharge

        # 4. Rebates (e.g. Senior citizen concession 5%)
        rebate = (gross_tax * 0.05) if has_senior_resident else 0.0
        net_tax = max(0.0, gross_tax - rebate)

        breakdown = {
            "volume_component_inr": round(volume_m3 * base_rate, 2),
            "floor_elevation_factor_applied": round(floor_multiplier, 3),
            "adjusted_volumetric_base_inr": round(volumetric_tax, 2),
            "commercial_surcharge_inr": commercial_surcharge,
            "senior_citizen_rebate_inr": round(rebate, 2),
            "formula_applied": "Volume(m³) x BaseRate x FloorMultiplier + CommercialSurcharge - Rebates"
        }

        return PropertyTaxAssessment(
            ulpin_3d=ulpin_3d,
            unit_label=unit_label,
            property_type=property_type,
            floor_level=floor_level,
            volume_m3=volume_m3,
            base_rate_inr_per_m3=base_rate,
            floor_multiplier=floor_multiplier,
            commercial_surcharge_inr=commercial_surcharge,
            gross_annual_tax_inr=gross_tax,
            rebate_inr=rebate,
            net_annual_tax_inr=net_tax,
            tax_breakdown=breakdown,
        )
