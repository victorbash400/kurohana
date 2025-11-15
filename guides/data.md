# Data Guide

The project bundles four canonical datasets under `backend/sample_data/` purely for local experimentation. These files are lightweight enough to commit; anything larger should stay out of version control.

## Files

- `anscombe.json`: reference data for visualization sanity checks.
- `california_housing_train.csv` / `california_housing_test.csv`: regression baseline (unused by current models but kept for demos).
- `mnist_train_small.csv` / `mnist_test.csv`: optional benchmarking set.
- `README.md`: short description of each dataset.

The production models actually consume:

- `engine_failure.csv` (four sensor features + `class` label) → saved as `engine` model.
- `naval_condition.csv` (two torque/temperature features + `target` column) → saved as `naval` model.

Place those CSVs in `backend/sample_data/` before running `python utils/train_models.py`. The scripts automatically stratify, encode, and persist artifacts.

## Version Control Guidance

- Keep tiny educational datasets committed so fresh clones can run tests out of the box.
- For proprietary or >10 MB files use `.gitignore` and document the fetch location inside this guide.
- Note checksum or dataset release link when sharing with collaborators.

## Preprocessing Summary

1. Read CSV via pandas.
2. Split train/test using `train_test_split` with fixed random seed.
3. Identify imbalance and run SMOTE for the engine classifier.
4. Train XGBoost (classifier for engine, regressor for naval).
5. Persist `model.joblib` and SHAP explainer under dedicated directories.

When switching to a new dataset version, re-run training and redeploy artifacts.
