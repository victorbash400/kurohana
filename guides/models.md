# Models Guide

Two XGBoost pipelines power Kurohana:

1. **Engine Fault Classifier** (`engine_model.joblib` + `engine_explainer.joblib`).
2. **Naval Condition Regressor** (`naval_model.joblib` + `naval_explainer.joblib`).

Artifacts live in `backend/models/` and `backend/explainers/` respectively.

## Training Scripts

Located in `backend/utils/`:

- `train_engine_model.py`
- `train_naval_model.py`
- `train_models.py` (wrapper with `engine`, `naval`, or `all` arguments)

Each script performs:

1. Load CSV from `backend/sample_data/`.
2. Split train/test.
3. Apply SMOTE for classification imbalance (engine only).
4. Train XGBoost with tuned hyperparameters.
5. Compute SHAP TreeExplainers.
6. Save artifacts with timestamped logging.

Example run:

```pwsh
cd backend
./venv/Scripts/python.exe utils/train_models.py all
```

## Model Interface

- Engine endpoint expects 4 floats: `sensor_measurement_1..4`.
- Naval endpoint expects 2 floats: `lever_position`, `ship_speed`.

Both return prediction plus SHAP contribution arrays consumed by the frontend for color-coded cards.

## Updating Models

When retraining:

1. Ensure new model/explainer files overwrite the old ones.
2. Restart backend to reload artifacts.
3. The frontend health panel should flip to healthy once `/health` sees both files.

## Troubleshooting

- Missing artifact → `/health` shows the failing domain and predictions return `503`.
- Shape mismatch → confirm request payload keys align with the training dataframe column order.
- Slow predictions → verify SHAP explainer was built with the matching dataset; mismatched XGBoost versions can degrade performance.
