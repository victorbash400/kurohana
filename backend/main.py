from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import joblib
import numpy as np
import shap
from typing import List, Dict

app = FastAPI(title="Predictive Maintenance API")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths for persisted artifacts
BACKEND_ROOT = Path(__file__).resolve().parent
MODELS_DIR = BACKEND_ROOT / "models"
EXPLAINERS_DIR = BACKEND_ROOT / "explainers"


def load_artifact(path: Path, label: str):
    try:
        return joblib.load(path)
    except FileNotFoundError:
        print(f"Warning: {label} missing at {path}")
    except Exception as exc:
        print(f"Warning: Failed to load {label}: {exc}")
    return None


# Load models and explainers
engine_model = load_artifact(MODELS_DIR / "marine_model.pkl", "engine model")
engine_explainer = load_artifact(EXPLAINERS_DIR / "engine_shap_explainer.pkl", "engine explainer")
naval_model = load_artifact(MODELS_DIR / "naval_model.pkl", "naval model")
naval_explainer = load_artifact(EXPLAINERS_DIR / "naval_shap_explainer.pkl", "naval explainer")

# Request models
class EnginePredictionRequest(BaseModel):
    Lever_position: float
    Ship_speed: float
    Gas_Turbine_shaft_torque: float
    Gas_Turbine_rate_of_revolutions: float
    Gas_Generator_rate_of_revolutions: float
    Starboard_Propeller_Torque: float
    Port_Propeller_Torque: float
    HP_Turbine_exit_temperature: float
    GT_Compressor_inlet_air_temperature: float
    GT_Compressor_outlet_air_temperature: float
    HP_Turbine_exit_pressure: float

class NavalPredictionRequest(BaseModel):
    Lever_position: float
    Ship_speed_knots: float
    Gas_Turbine_shaft_torque_kN_m: float
    Gas_Turbine_rate_of_revolutions_rpm: float
    Gas_Generator_rate_of_revolutions_rpm: float
    Starboard_Propeller_Torque_kN: float
    Port_Propeller_Torque_kN: float
    HP_Turbine_exit_temperature_C: float
    GT_Compressor_inlet_air_temperature_C: float
    GT_Compressor_outlet_air_temperature_C: float
    HP_Turbine_exit_pressure_psi: float
    GT_Compressor_inlet_air_pressure_psi: float
    GT_Compressor_outlet_air_pressure_bar: float
    Gas_Turbine_exhaust_gas_pressure_psi: float
    Turbine_Injecton_Control: float
    Fuel_flow_lg_s: float

@app.get("/")
def read_root():
    return {
        "message": "Predictive Maintenance API",
        "endpoints": {
            "engine": "/predict/engine",
            "naval": "/predict/naval",
            "health": "/health"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "engine_model_loaded": engine_model is not None,
        "engine_explainer_loaded": engine_explainer is not None,
        "naval_model_loaded": naval_model is not None,
        "naval_explainer_loaded": naval_explainer is not None,
    }

@app.post("/predict/engine")
def predict_engine(request: EnginePredictionRequest):
    if engine_model is None or engine_explainer is None:
        raise HTTPException(status_code=503, detail="Engine artifacts not loaded")
    
    try:
        # Convert request to array
        features = np.array([[
            request.Lever_position,
            request.Ship_speed,
            request.Gas_Turbine_shaft_torque,
            request.Gas_Turbine_rate_of_revolutions,
            request.Gas_Generator_rate_of_revolutions,
            request.Starboard_Propeller_Torque,
            request.Port_Propeller_Torque,
            request.HP_Turbine_exit_temperature,
            request.GT_Compressor_inlet_air_temperature,
            request.GT_Compressor_outlet_air_temperature,
            request.HP_Turbine_exit_pressure
        ]])
        
        # Make prediction
        prediction = int(engine_model.predict(features)[0])
        probabilities = engine_model.predict_proba(features)[0].tolist()
        
        # Calculate SHAP values
        shap_values = engine_explainer(features)
        feature_names = list(request.dict().keys())
        
        condition_map = {0: "Normal", 1: "Minor Fault", 2: "Critical Fault"}
        
        return {
            "prediction": prediction,
            "condition": condition_map[prediction],
            "probabilities": {
                "normal": probabilities[0],
                "minor_fault": probabilities[1],
                "critical_fault": probabilities[2]
            },
            "feature_importance": {
                feature_names[i]: float(shap_values.values[0, i, prediction])
                for i in range(len(feature_names))
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/naval")
def predict_naval(request: NavalPredictionRequest):
    if naval_model is None or naval_explainer is None:
        raise HTTPException(status_code=503, detail="Naval artifacts not loaded")
    
    try:
        # Convert request to array
        features = np.array([[
            request.Lever_position,
            request.Ship_speed_knots,
            request.Gas_Turbine_shaft_torque_kN_m,
            request.Gas_Turbine_rate_of_revolutions_rpm,
            request.Gas_Generator_rate_of_revolutions_rpm,
            request.Starboard_Propeller_Torque_kN,
            request.Port_Propeller_Torque_kN,
            request.HP_Turbine_exit_temperature_C,
            request.GT_Compressor_inlet_air_temperature_C,
            request.GT_Compressor_outlet_air_temperature_C,
            request.HP_Turbine_exit_pressure_psi,
            request.GT_Compressor_inlet_air_pressure_psi,
            request.GT_Compressor_outlet_air_pressure_bar,
            request.Gas_Turbine_exhaust_gas_pressure_psi,
            request.Turbine_Injecton_Control,
            request.Fuel_flow_lg_s,
        ]])
        
        # Make prediction
        predictions = naval_model.predict(features)[0]
        
        # Calculate SHAP values
        shap_values = naval_explainer(features)
        feature_names = list(request.dict().keys())
        
        return {
            "predictions": {
                "compressor_decay": float(predictions[0]),
                "turbine_decay": float(predictions[1])
            },
            "feature_importance": {
                "compressor": {
                    feature_names[i]: float(shap_values.values[0, i, 0])
                    for i in range(len(feature_names))
                },
                "turbine": {
                    feature_names[i]: float(shap_values.values[0, i, 1])
                    for i in range(len(feature_names))
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
