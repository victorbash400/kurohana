from pathlib import Path
import sys

from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from main import app


client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Predictive Maintenance API"
    assert "engine" in data["endpoints"]


def test_health_returns_status():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert isinstance(data["engine_model_loaded"], bool)
    assert isinstance(data["naval_model_loaded"], bool)


def test_engine_prediction_unavailable_without_models():
    payload = {
        "Lever_position": 0.5,
        "Ship_speed": 10,
        "Gas_Turbine_shaft_torque": 100,
        "Gas_Turbine_rate_of_revolutions": 100,
        "Gas_Generator_rate_of_revolutions": 100,
        "Starboard_Propeller_Torque": 100,
        "Port_Propeller_Torque": 100,
        "HP_Turbine_exit_temperature": 100,
        "GT_Compressor_inlet_air_temperature": 100,
        "GT_Compressor_outlet_air_temperature": 100,
        "HP_Turbine_exit_pressure": 100,
    }
    response = client.post("/predict/engine", json=payload)
    assert response.status_code in {200, 503}


def test_naval_prediction_unavailable_without_models():
    payload = {
        "Lever_position": 0.5,
        "Ship_speed_knots": 10,
        "Gas_Turbine_shaft_torque_kN_m": 100,
        "Gas_Turbine_rate_of_revolutions_rpm": 100,
        "Gas_Generator_rate_of_revolutions_rpm": 100,
        "Starboard_Propeller_Torque_kN": 100,
        "Port_Propeller_Torque_kN": 100,
        "HP_Turbine_exit_temperature_C": 100,
        "GT_Compressor_inlet_air_temperature_C": 100,
        "GT_Compressor_outlet_air_temperature_C": 100,
        "HP_Turbine_exit_pressure_psi": 100,
        "GT_Compressor_inlet_air_pressure_psi": 100,
        "GT_Compressor_outlet_air_pressure_bar": 100,
        "Gas_Turbine_exhaust_gas_pressure_psi": 100,
        "Turbine_Injecton_Control": 1,
        "Fuel_flow_lg_s": 1,
        "GT_Compressor_decay_state_coefficient": 1,
        "GT_Turbine_decay_state_coefficient": 1,
    }
    response = client.post("/predict/naval", json=payload)
    assert response.status_code in {200, 503}
