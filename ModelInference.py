"""Model inference and SHAP value generation for churn prediction.

This module handles model predictions, churn rate calculation, and SHAP
value generation for customer churn analysis.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional

import numpy as np
import pandas as pd
import shap

from Data_Processing import Data_Processing


# Constants
OUTPUT_JSON_FILE = "prompts/prompt_dataset.json"
CHURN_LABEL_COLUMN = "Churn"
CHURN_POSITIVE_CLASS_INDEX = 1


class ModelInference:
    
    def __init__(self) -> None:
        pass
    
    def model_inference(
        self,
        model: Any,
        threshold: float,
        input_data: pd.DataFrame,
        explainer: Any,
        output_file: Optional[str] = None
    ) -> str:
        if input_data.empty:
            raise ValueError("Input data cannot be empty")
        
        if CHURN_LABEL_COLUMN not in input_data.columns:
            raise KeyError(f"Required column '{CHURN_LABEL_COLUMN}' not found")
        
        # Prepare data for prediction (remove label column)
        features_data = input_data.drop(columns=[CHURN_LABEL_COLUMN])
        
        # Generate predictions
        churn_probabilities = model.predict_proba(features_data)[:, CHURN_POSITIVE_CLASS_INDEX]
        churn_predictions = (churn_probabilities >= threshold).astype(int)
        
        # Calculate churn rate
        churn_count = int(np.sum(churn_predictions))
        churn_rate = churn_count / len(churn_predictions)
        print(f"Predicted churn count: {churn_count}")
        print(f"Churn rate: {churn_rate:.2%}")
        
        # Generate SHAP explanations for each customer
        customer_results = self._generate_shap_explanations(
            features_data=features_data,
            explainer=explainer,
            churn_probabilities=churn_probabilities
        )
        
        # Save and return results
        output_path = output_file or OUTPUT_JSON_FILE
        self._save_results(customer_results, output_path)
        
        return json.dumps(customer_results, indent=2)
    
    def _generate_shap_explanations(
        self,
        features_data: pd.DataFrame,
        explainer: Any,
        churn_probabilities: np.ndarray
    ) -> Dict[str, Dict[str, Any]]:
        customer_results = {}
        num_customers = features_data.shape[0]
        
        for customer_idx in range(num_customers):
            customer_observation = features_data.iloc[[customer_idx]]
            
            # Compute SHAP values
            shap_explanation = explainer(
                customer_observation,
                check_additivity=False
            )
            
            # Extract feature names and values
            feature_names = shap_explanation.feature_names
            feature_values = customer_observation[feature_names].iloc[0].to_dict()
            
            # Extract SHAP values for positive class
            shap_values = shap_explanation.values[0, :, CHURN_POSITIVE_CLASS_INDEX]
            shap_feature_values = dict(zip(
                feature_names,
                shap_values.astype(float).tolist()
            ))
            
            # Store customer results
            customer_key = f"Customer{customer_idx}"
            customer_results[customer_key] = {
                "feature_values": feature_values,
                "shap_feature_values": shap_feature_values,
                "churn_probability": float(churn_probabilities[customer_idx])
            }
        
        return customer_results
    
    def _save_results(self, results: Dict[str, Dict[str, Any]], file_path: str) -> None:
        output_path = Path(file_path)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to {output_path}")
