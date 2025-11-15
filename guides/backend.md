# Backend Guide

FastAPI service that exposes engine fault classification and naval condition regression endpoints backed by trained XGBoost models.

## Environment

- Python 3.11+
- FastAPI + Uvicorn
- Scikit-learn, XGBoost, imbalanced-learn, SHAP, Joblib

Create and activate the virtual environment (if not already):

```pwsh
cd backend
python -m venv venv
./venv/Scripts/Activate.ps1
pip install -r requirements.txt
```

## Training Artifacts

The API expects pre-trained joblib artifacts in `backend/models/` and explainers in `backend/explainers/`. Use `python utils/train_engine_model.py` and `python utils/train_naval_model.py` (or `python utils/train_models.py all`) after placing the CSV datasets under `backend/sample_data/`.

## Running the API

```pwsh
cd backend
./venv/Scripts/python.exe main.py
# or hot reload
a uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check: `GET /health` reports model/explainer readiness for both domains.

## Tests

```pwsh
cd backend
pytest
```

The suite verifies `/`, `/health`, and both prediction endpoints (ensuring they gracefully return `503` when artifacts are missing).

## Observability

- Console logs show model loading warnings at startup.
- The frontend polls `/health` every 15 seconds and surfaces status in the sticky top bar plus the in-app terminal log.
