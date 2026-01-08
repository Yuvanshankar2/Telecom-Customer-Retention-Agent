# Customer Retention Agent

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![License](https://img.shields.io/badge/License-NVIDIA%20OML-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)

---

## Overview

This project implements an **LLM-based reasoning pipeline** for customer churn prediction and explanation. It combines **SHAP feature importance** with **large language models (LLMs)** to generate human-readable insights, helping businesses understand why a customer may churn and identify actionable strategies for retention.

Key features include:

- End-to-end workflow for **churn prediction and reasoning**  
- **SHAP-based feature analysis** for model interpretability  
- **LLM-powered natural language explanations**  
- **Prompt distillation pipeline** for optimized LLM outputs  
- Modular design for **RAG integration** or future fine-tuning  

This project showcases a **modern AI workflow**, bridging traditional data science and advanced NLP techniques — highly relevant for industry roles in AI, ML, and data-driven decision-making.

---

## Prompt Distillation

High-quality LLM outputs depend heavily on **prompt design**. This repository includes a **Prompt Distillation module** that identifies the most effective prompt template for your dataset.

### Workflow

1. **Prepare Dataset**  
   - JSON dataset containing customer information, SHAP values, and reference explanations.

2. **Define Prompt Templates**  
   - Multiple candidate templates provided in a JSON file.

3. **Evaluate Templates**  
   - Each template is evaluated on all customers using **semantic similarity metrics** between generated outputs and ground-truth explanations.

4. **Aggregate Scores**  
   - Metrics such as **mean, median, and standard deviation** are calculated across all records.

5. **Select Best Template**  
   - The template with the highest average similarity is chosen as the **distilled prompt**, and all results are saved in JSON for reproducibility.

### Benefits

- Demonstrates **expertise in prompt engineering**  
- Combines **traditional ML interpretability** with **modern LLM reasoning**  
- Provides a **robust, reproducible, and automated workflow**  
- Ideal for industry-scale LLM evaluation and business-focused insights  

---

## Getting Started


