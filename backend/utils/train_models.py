"""
Training script for both predictive maintenance models.
Run this to train and save the models before starting the API.
"""
from pathlib import Path

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, r2_score, mean_squared_error, mean_absolute_error
from imblearn.over_sampling import SMOTE
import xgboost as xgb
import shap
import joblib
import os


BACKEND_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_ROOT / "sample_data"
MODELS_DIR = BACKEND_ROOT / "models"
EXPLAINERS_DIR = BACKEND_ROOT / "explainers"

def train_engine_model():
    print("=" * 50)
    print("Training Engine Fault Detection Model")
    print("=" * 50)
    
    # Load dataset
    df_engine = load_dataset('engine_fault_detection_dataset.csv')
    print(f"Loaded {len(df_engine)} samples")
    
    # Clean target variable
    df_engine['Engine_Condition'] = pd.to_numeric(df_engine['Engine_Condition'], errors='coerce')
    df_engine.dropna(subset=['Engine_Condition'], inplace=True)
    df_engine['Engine_Condition'] = df_engine['Engine_Condition'].astype(int)
    
    # Split features and target
    X = df_engine.drop('Engine_Condition', axis=1)
    y = df_engine['Engine_Condition']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Apply SMOTE to balance classes
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
    print(f"After SMOTE: {y_train_resampled.value_counts().to_dict()}")
    
    # Train XGBoost classifier
    xgb_model = xgb.XGBClassifier(
        objective='multi:softmax',
        num_class=3,
        use_label_encoder=False,
        eval_metric='mlogloss',
        random_state=42
    )
    
    print("Training model...")
    xgb_model.fit(X_train_resampled, y_train_resampled)
    
    # Evaluate
    y_pred = xgb_model.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, 
                                target_names=['Normal', 'Minor Fault', 'Critical Fault']))
    
    # Create SHAP explainer
    explainer = shap.TreeExplainer(xgb_model)
    
    # Save models
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    EXPLAINERS_DIR.mkdir(parents=True, exist_ok=True)
    engine_model_path = MODELS_DIR / 'marine_model.pkl'
    engine_explainer_path = EXPLAINERS_DIR / 'engine_shap_explainer.pkl'
    joblib.dump(xgb_model, engine_model_path)
    joblib.dump(explainer, engine_explainer_path)
    print(f"\n✓ Engine model saved to {engine_model_path}")
    print(f"✓ SHAP explainer saved to {engine_explainer_path}")

def train_naval_model():
    print("\n" + "=" * 50)
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


def load_dataset(filename: str) -> pd.DataFrame:
    dataset_path = DATA_DIR / filename
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset {filename} is missing. Expected at {dataset_path}."
        )
    return pd.read_csv(dataset_path)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        model_type = sys.argv[1].lower()
        if model_type == "engine":
            train_engine_model()
            print("\n" + "=" * 50)
            print("Engine model trained successfully!")
            print("=" * 50)
        elif model_type == "naval":
            train_naval_model()
            print("\n" + "=" * 50)
            print("Naval model trained successfully!")
            print("=" * 50)
        else:
            print("Usage: python train_models.py [engine|naval|all]")
            sys.exit(1)
    else:
        # Train both by default
        train_engine_model()
        train_naval_model()
        print("\n" + "=" * 50)
        print("All models trained successfully!")
        print("=" * 50)
