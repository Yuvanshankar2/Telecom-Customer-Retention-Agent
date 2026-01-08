# Customer Retention Agent

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![License](https://img.shields.io/badge/License-NVIDIA%20OML-blue)


---

## Overview

This project implements an **LLM-based reasoning pipeline** for customer churn prediction and explanation. It combines **SHAP feature importance** with **large language models (LLMs)** to generate human-readable insights, helping businesses understand why a customer may churn and identify actionable strategies for retention.

Key features include:

- End-to-end workflow for **churn prediction and reasoning**. **(in progress)** 
- **SHAP-based feature analysis** for model interpretability 
- **LLM-powered natural language explanations**  
- **Prompt distillation pipeline** for optimized LLM outputs  
- Modular design for **RAG integration** or future fine-tuning **(in progress)** 

This project showcases a **modern AI workflow**, bridging traditional data science with **LLM-driven reasoning and explainability**, and is designed to support future NLP and retrieval-based extensions.

---

## Getting Started

Follow these steps to set up and run this repository:


# 1. Clone the repository
``` bash
git clone
```
# 2. Create and activate a virtual environment

# macOS/Linux
``` bash
python3 -m venv venv
source venv/bin/activate
```

# Windows
``` bash
python -m venv venv
venv\Scripts\activate
```
# 3. Install dependencies
``` bash
pip install --upgrade pip
pip install -r requirements.txt
```
# 4. Set up environment variables
# Create an OpenRouter API key to access the LLM 
# Create a .env file in the root directory and store your key.

# 5. Run the project
# Run LLM.py

---
### Data Processing Phase

The data processing stage is implemented in the `Data_Processing` class and focuses on preparing categorical features for analysis of the churn variable.

Several categorical features were converted into binary-encoded representations. This decision was informed by exploratory analysis, where specific categories within these features showed a strong majority association with either churn (`1`) or non-churn (`0`). Based on this observation, binary indicators were used to preserve the dominant signal while simplifying the feature space.

**Key steps performed by `processData()` include:**

- Creation of derived binary indicator columns:
  - `isElectronic`: Stacked bar plots revealed that Electronic Check users churn at 45.3%, significantly higher than Bank Transfer (16.7%), Credit Card (15.2%), and Mailed Check (19.1%). I  encoded this as a binary feature isElectronic = 1 for Electronic Check users and 0 for all others to capture the primary churn driver.
  - `isFiber`: The stacked bar plots indicated that Fiber Optic customers churn at 41.9%, far exceeding DSL (19%) and No Internet (7.4%). Accordingly, I created a binary feature isFiber = 1 for Fiber Optic users and 0 otherwise, highlighting the highest-risk category in a simplified format.
  - `isMonth`: Analysis of stacked bar plots showed that customers on Month-to-Month contracts churn at 42.7%, compared to 11.3% for One-Year and 2.8% for Two-Year contracts. To capture this dominant signal, I created a binary feature isMonth = 1 for Month-to-Month contracts and 0 otherwise, simplifying the feature space while preserving the strongest predictive signal.

- Binary encoding of `"Yes"` / `"No"` categorical fields:
  - `Partner`
  - `Dependents`
  - `MultipleLines`
  - `OnlineSecurity`
  - `OnlineBackup`
  - `DeviceProtection`
  - `TechSupport`
  - `StreamingTV`
  - `StreamingMovies`
  - `Churn`

- Explicit conversion of all encoded features to integer type (`0` or `1`)

- Removal of features that were determined during exploratory analysis to have no observable effect on the churn variable:
  - `customerID`
  - `PaperlessBilling`
  - `gender`
  - `PhoneService`
  - `TotalCharges`
  - `InternetService`
  - `PaymentMethod`
  - `Contract`
  - `OnlineBackup`
  - `DeviceProtection`

The method returns a pandas `DataFrame` containing the processed numerical features.

---

### Hyperparameter Tuning Phase

The hyperparameter tuning stage is implemented in the `Hyperparameter_Tuning` class and is responsible for optimizing a **Random Forest classifier** for churn prediction. The process focuses on maximizing **recall**, ensuring that the model is sensitive to detecting churned customers.  

**Key steps performed by `Hyperparameter_Tuning` include:**  

- **Data Preparation:**  
  - Features (`X`) and target (`y`) are separated from the processed dataset.  
  - Data is split into training and test sets with stratification to preserve the class distribution.  

- **Bayesian Hyperparameter Optimization:**  
  - Uses **Optuna**, a Bayesian optimization framework, to tune the Random Forest.  
  - Hyperparameters optimized include:  
    - `n_estimators`: number of trees in the forest  
    - `max_depth`: maximum depth of each tree  
    - `min_samples_split`: minimum samples required to split a node  
    - `max_features`: proportion of features considered at each split  
  - **5-fold stratified cross-validation** is used to evaluate each hyperparameter combination, and the objective function maximizes **recall**.  

- **Model Training and Threshold Tuning:**  
  - The best hyperparameters are used to fit the final Random Forest model on the training data.  
  - A **custom probability threshold** is calculated to achieve a recall of at least 0.9 on a validation split.  
  - This threshold is applied to convert predicted probabilities into class labels for the test set, improving sensitivity to churned customers.  

- **Model Evaluation and Explainability:**  
  - Recall is reported **before and after applying the optimized threshold**, demonstrating the effect of threshold tuning.  
  - SHAP (SHapley Additive exPlanations) values are computed using a **subset of training data** to explain the contribution of each feature to model predictions.  
  - This ensures that the tuned model is both **accurate and interpretable**.  

**Outputs:**  

- `updated_model`: the trained Random Forest classifier with optimized hyperparameters  
- `optimal_threshold`: probability threshold selected to maximize recall  
- `explainer`: SHAP explainer object for feature-level interpretability

---
## Prompt Distillation Phase

High-quality LLM outputs depend heavily on **prompt design**. This repository includes a **Prompt Distillation module** that identifies the most effective prompt template for your dataset.

### Workflow

1. **Prepare Dataset**  
   - JSON dataset containing customer information, SHAP values, and reference explanations.

2. **Define Prompt Templates**  
   - Multiple candidate templates provided in a JSON file.

3. **Evaluate Templates**  
   - Each prompt template is evaluated on all customers using **semantic similarity metrics** and, additionally, a **manual LLM-based evaluation** to qualitatively assess the relevance and clarity of generated explanations. This manual step provided an extra layer of judgment to select the most effective prompt, complementing the automated metrics.

4. **Aggregate Scores**  
   - Metrics such as **mean, median, and standard deviation** are calculated across all records.

5. **Select Best Template**  
   - The template with the highest average similarity is chosen as the **distilled prompt**, and all results are saved in JSON for reproducibility.

### Benefits

- Demonstrates **expertise in prompt engineering**  
- Combines **traditional ML interpretability** with **modern LLM reasoning**  
- Provides a **robust, and reproducible workflow**    

---

