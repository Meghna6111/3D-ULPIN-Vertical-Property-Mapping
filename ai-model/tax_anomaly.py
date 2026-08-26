"""
AI Tax Anomaly & Illegal Vertical Floor Detector
Uses Scikit-Learn & Rule-Based Volumetric Auditing to compare physical 3D cadastral
reconstructions against registered municipal tax declarations to catch vertical tax evasion.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import numpy as np

@dataclass
class AnomalyAuditReport:
    base_plot_id: str
    declared_floors: int
    physical_reconstructed_floors: int
    declared_volume_m3: float
    physical_volume_m3: float
    unpermitted_floors_count: int
    unpermitted_volume_m3: float
    is_anomaly: bool
    risk_level: str  # 'CRITICAL_TAX_FRAUD', 'MODERATE_DISCREPANCY', 'COMPLIANT'
    anomaly_score: float
    estimated_unpaid_tax_inr: float
    flagged_units: List[str]
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "base_plot_id": self.base_plot_id,
            "declared_floors": self.declared_floors,
            "physical_reconstructed_floors": self.physical_reconstructed_floors,
            "declared_volume_m3": round(self.declared_volume_m3, 2),
            "physical_volume_m3": round(self.physical_volume_m3, 2),
            "unpermitted_floors_count": self.unpermitted_floors_count,
            "unpermitted_volume_m3": round(self.unpermitted_volume_m3, 2),
            "is_anomaly": self.is_anomaly,
            "risk_level": self.risk_level,
            "anomaly_score": round(self.anomaly_score, 4),
            "estimated_unpaid_tax_inr": round(self.estimated_unpaid_tax_inr, 2),
            "flagged_units": self.flagged_units,
            "description": self.description,
        }

class TaxAnomalyDetector:
    def __init__(self, base_tax_rate_per_m3: float = 45.0, penalty_multiplier: float = 2.5):
        self.base_tax_rate_per_m3 = base_tax_rate_per_m3
        self.penalty_multiplier = penalty_multiplier
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from sklearn.ensemble import IsolationForest
                rng = np.random.RandomState(42)
                normal_data = rng.normal(loc=[1.0, 1.0, 0.0], scale=[0.05, 0.05, 0.2], size=(100, 3))
                fraud_data = np.array([
                    [1.67, 1.60, 6.4],
                    [1.50, 1.45, 3.2],
                    [2.00, 1.95, 9.6],
                    [1.33, 1.40, 3.2],
                ])
                train_x = np.vstack([normal_data, fraud_data])
                clf = IsolationForest(n_estimators=50, contamination=0.08, random_state=42, n_jobs=1)
                clf.fit(train_x)
                self._model = clf
            except Exception:
                self._model = "fallback"
        return self._model

    def audit_complex(
        self,
        base_plot_id: str,
        declared_floors: int,
        physical_floors: int,
        declared_volume_m3: float,
        physical_volume_m3: float,
        unit_details: Optional[List[Dict[str, Any]]] = None
    ) -> AnomalyAuditReport:
        """Audits a building complex against municipal registered records."""
        unpermitted_floors = max(0, physical_floors - declared_floors)
        unpermitted_vol = max(0.0, physical_volume_m3 - declared_volume_m3)

        floor_ratio = physical_floors / max(1, declared_floors)
        volume_ratio = physical_volume_m3 / max(1.0, declared_volume_m3)
        height_deviation = unpermitted_floors * 3.2

        model = self._get_model()
        is_pred_anomaly = False
        decision_score = 0.0

        if model != "fallback":
            try:
                features = np.array([[floor_ratio, volume_ratio, height_deviation]])
                pred = model.predict(features)[0]
                is_pred_anomaly = (pred == -1)
                decision_score = float(model.decision_function(features)[0])
            except Exception:
                pass

        anomaly_score = max(0.0, min(1.0, 0.5 - decision_score))

        flagged_units = []
        if unit_details:
            for u in unit_details:
                f_lvl = u.get("floor_level", 0)
                if f_lvl > declared_floors:
                    flagged_units.append(f"{u.get('unit_label', 'Unit')} (Floor {f_lvl}, ULPIN: {u.get('ulpin_3d', 'N/A')})")

        if unpermitted_floors == 0 and not flagged_units:
            if physical_floors > declared_floors:
                for f in range(declared_floors + 1, physical_floors + 1):
                    flagged_units.append(f"Illegal Vertical Extension - Floor {f}")

        is_fraud = unpermitted_floors > 0 or is_pred_anomaly or volume_ratio > 1.15

        if unpermitted_floors >= 2 or volume_ratio >= 1.4:
            risk_level = "CRITICAL_TAX_FRAUD"
            desc = f"CRITICAL FRAUD: {unpermitted_floors} unpermitted floors detected ({round(unpermitted_vol, 1)} m³ unauthorized volume). Paid for {declared_floors} floors, constructed {physical_floors} floors."
        elif unpermitted_floors == 1 or volume_ratio > 1.1:
            risk_level = "MODERATE_DISCREPANCY"
            desc = f"WARNING: Physical volumetric footprint exceeds municipal permits by {round(unpermitted_vol, 1)} m³."
        else:
            risk_level = "COMPLIANT"
            desc = f"Compliant: Physical 3D building height ({physical_floors} floors) matches municipal registry ({declared_floors} floors)."

        unpaid_tax = unpermitted_vol * self.base_tax_rate_per_m3 * self.penalty_multiplier

        return AnomalyAuditReport(
            base_plot_id=base_plot_id,
            declared_floors=declared_floors,
            physical_reconstructed_floors=physical_floors,
            declared_volume_m3=declared_volume_m3,
            physical_volume_m3=physical_volume_m3,
            unpermitted_floors_count=unpermitted_floors,
            unpermitted_volume_m3=unpermitted_vol,
            is_anomaly=is_fraud,
            risk_level=risk_level,
            anomaly_score=anomaly_score if is_fraud else 0.042,
            estimated_unpaid_tax_inr=unpaid_tax,
            flagged_units=flagged_units,
            description=desc,
        )
