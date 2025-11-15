"""
Training script for Engine Fault Detection Model the datasets are missing so utazidrop pale sample data folder.
"""
from pathlib import Path

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from imblearn.over_sampling import SMOTE
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

if __name__ == "__main__":
    train_engine_model()
    print("\n" + "=" * 50)
    print("Engine model trained successfully!")
    print("=" * 50)
