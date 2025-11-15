"""
Training script for Naval Vessel Condition Model.
"""
from pathlib import Path

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import xgboost as xgb
import shap
import joblib


BACKEND_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_ROOT / "sample_data"
MODELS_DIR = BACKEND_ROOT / "models"
EXPLAINERS_DIR = BACKEND_ROOT / "explainers"

def load_dataset(filename: str) -> pd.DataFrame:
    dataset_path = DATA_DIR / filename
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset {filename} is missing. Expected at {dataset_path}."
        )
    return pd.read_csv(dataset_path)

def train_naval_model():
    print("=" * 50)
    print("Training Naval Vessel Condition Model")
    print("=" * 50)
    
    # Load dataset
    df_naval = load_dataset('Predictive_Maintenance_Naval_Vessel_Condition.csv')
    print(f"Loaded {len(df_naval)} samples")
    
    # Clean column names
    if 'Unnamed: 0' in df_naval.columns:
        df_naval = df_naval.drop('Unnamed: 0', axis=1)
    if 'index' in df_naval.columns:
        df_naval = df_naval.drop('index', axis=1)
    
    df_naval.columns = (df_naval.columns
                        .str.replace('[\[\]()]', '', regex=True)
                        .str.strip()
                        .str.replace(' ', '_')
                        .str.replace('.', ''))
    
    # Define targets
    target_cols = ['GT_Compressor_decay_state_coefficient', 'GT_Turbine_decay_state_coefficient']
    
    # Split features and targets
    X_naval = df_naval.drop(columns=target_cols)
    y_naval = df_naval[target_cols]
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_naval, y_naval, test_size=0.2, random_state=42
    )
    
    # Train XGBoost regressor
    xgb_regressor = xgb.XGBRegressor(
        objective='reg:squarederror',
        random_state=42
    )
    
    print("Training model...")
    xgb_regressor.fit(X_train, y_train)
    
    # Evaluate
    y_pred = xgb_regressor.predict(X_test)
    y_pred_df = pd.DataFrame(y_pred, columns=target_cols)
    
    print("\nRegression Metrics:")
    for i, col in enumerate(target_cols):
        r2 = r2_score(y_test[col], y_pred_df[col])
        rmse = np.sqrt(mean_squared_error(y_test[col], y_pred_df[col]))
        mae = mean_absolute_error(y_test[col], y_pred_df[col])
        print(f"\n{col}:")
        print(f"  R²: {r2:.4f}")
        print(f"  RMSE: {rmse:.6f}")
        print(f"  MAE: {mae:.6f}")
    
    # Create SHAP explainer
    reg_explainer = shap.TreeExplainer(xgb_regressor)
    
    # Save models
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    EXPLAINERS_DIR.mkdir(parents=True, exist_ok=True)
    naval_model_path = MODELS_DIR / 'naval_model.pkl'
    naval_explainer_path = EXPLAINERS_DIR / 'naval_shap_explainer.pkl'
    joblib.dump(xgb_regressor, naval_model_path)
    joblib.dump(reg_explainer, naval_explainer_path)
    print(f"\n✓ Naval model saved to {naval_model_path}")
    print(f"✓ SHAP explainer saved to {naval_explainer_path}")

if __name__ == "__main__":
    train_naval_model()
    print("\n" + "=" * 50)
    print("Naval model trained successfully!")
    print("=" * 50)
