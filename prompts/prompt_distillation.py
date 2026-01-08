
import json
import time
import os
from dotenv import load_dotenv
import logging
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from collections import defaultdict
import statistics
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_TRAIN_DATASET = "prompts/prompt_train_dataset.json"
DEFAULT_TEMPLATES_FILE = "prompts/prompt_templates.json"
DEFAULT_OUTPUT_FILE = "prompts/distilled_prompt.json"


def generate_output_from_prompt(prompt: str, customer_data: Dict[str, Any]) -> str:
    # This is where we will use the openRouter API to connect with an LLM
    time.sleep(4)
    load_dotenv()
    llm_key = os.getenv("LLM_KEY_1")
    model = "nvidia/nemotron-3-nano-30b-a3b:free"
    end_point = "https://openrouter.ai/api/v1/chat/completions"
    model_usage = {"model":model,"messages":[{"role":"user","content":prompt}]}
    reply = requests.post(end_point,headers={"Authorization":f"Bearer {llm_key}"},json=model_usage)
    print("Response:",reply.json()["choices"][0]["message"]["content"])
    return reply.json()["choices"][0]["message"]["content"]


def compute_similarity(text1: str, text2: str) -> float:
    similarity_evaluator = SentenceTransformer("all-MiniLM-L6-v2")
    sentence_inputs = [text1,text2]
    vectorValues =  similarity_evaluator.encode(sentence_inputs)
    similarity_score = cosine_similarity([vectorValues[0],vectorValues[1]])[0][0]
    return similarity_score


class PromptDistiller:
    
    def __init__(
        self,
        train_dataset_path: str = DEFAULT_TRAIN_DATASET,
        templates_path: str = DEFAULT_TEMPLATES_FILE,
        output_path: str = DEFAULT_OUTPUT_FILE
    ) -> None:
        self.train_dataset_path = Path(train_dataset_path)
        self.templates_path = Path(templates_path)
        self.output_path = Path(output_path)
        
        # Validate input files exist
        if not self.train_dataset_path.exists():
            raise FileNotFoundError(
                f"Training dataset not found: {train_dataset_path}"
            )
        if not self.templates_path.exists():
            raise FileNotFoundError(
                f"Prompt templates file not found: {templates_path}"
            )
        
        # Will be populated by load methods
        self.train_dataset: Dict[str, Dict[str, Any]] = {}
        self.prompt_templates: Dict[str, str] = {}
        
        logger.info(f"Initialized PromptDistiller with:")
        logger.info(f"  Train dataset: {train_dataset_path}")
        logger.info(f"  Templates: {templates_path}")
        logger.info(f"  Output: {output_path}")
    
    def load_train_dataset(self) -> Dict[str, Dict[str, Any]]:
        logger.info(f"Loading training dataset from {self.train_dataset_path}")
        
        with open(self.train_dataset_path, 'r', encoding='utf-8') as f:
            dataset = json.load(f)
        
        # Validate dataset structure
        for customer_id, customer_data in dataset.items():
            if "explanation" not in customer_data:
                raise KeyError(
                    f"Missing 'explanation' field for {customer_id}"
                )
        
        num_customers = len(dataset)
        logger.info(f"Loaded {num_customers} customer records")
        
        self.train_dataset = dataset
        return dataset
    
    def load_prompt_templates(self) -> Dict[str, str]:
        logger.info(f"Loading prompt templates from {self.templates_path}")
        
        with open(self.templates_path, 'r', encoding='utf-8') as f:
            templates = json.load(f)
        
        num_templates = len(templates)
        logger.info(f"Loaded {num_templates} prompt templates: {list(templates.keys())}")
        
        self.prompt_templates = templates
        return templates
    
    def format_prompt(
        self,
        template: str,
        customer_data: Dict[str, Any]
    ) -> str:
        # Extract SHAP feature values for formatting
        customer_copy = customer_data.copy()

        customer_copy.pop("explanation",None)
        # Convert to JSON string for insertion into prompt
        customer_json = json.dumps(customer_copy, indent=2)
        
        # Format template with available placeholders
        # Add more placeholders as needed (e.g., {churn_probability}, {feature_values})
        formatted_prompt = template.format(
            customer_data=customer_json
        )
        
        return formatted_prompt
    
    def evaluate_prompt_on_customer(
        self,
        template_name: str,
        template: str,
        customer_id: str,
        customer_data: Dict[str, Any]
    ) -> float:
        # Format prompt with customer data
        formatted_prompt = self.format_prompt(template, customer_data)
        
        # Generate output using LLM (placeholder implementation)
        generated_output = generate_output_from_prompt(
            formatted_prompt,
            customer_data
        )
        
        # Get ground truth explanation
        ground_truth = customer_data.get("explanation", "")
        
        if not ground_truth:
            logger.warning(
                f"No ground truth explanation for {customer_id}, skipping"
            )
            return 0.0
        
        # Compute similarity (placeholder implementation)
        similarity_score = compute_similarity(generated_output, ground_truth)
        
        logger.debug(
            f"Template '{template_name}' on {customer_id}: "
            f"similarity = {similarity_score:.4f}"
        )
        
        return similarity_score
    
    def evaluate_all_templates(self) -> Dict[str, List[float]]:
        if not self.train_dataset:
            self.load_train_dataset()
        
        if not self.prompt_templates:
            self.load_prompt_templates()
        
        # Dictionary to store scores: {template_name: [scores]}
        template_scores: Dict[str, List[float]] = defaultdict(list)
        
        num_customers = len(self.train_dataset)
        num_templates = len(self.prompt_templates)
        
        logger.info(
            f"Evaluating {num_templates} templates on {num_customers} customers"
        )
        
        # Evaluate each template on each customer
        for template_name, template in self.prompt_templates.items():
            logger.info(f"Evaluating template: {template_name}")
            
            for customer_id, customer_data in self.train_dataset.items():
                try:
                    score = self.evaluate_prompt_on_customer(
                        template_name,
                        template,
                        customer_id,
                        customer_data
                    )
                    template_scores[template_name].append(score)
                
                except Exception as e:
                    logger.error(
                        f"Error evaluating {template_name} on {customer_id}: {e}"
                    )
                    # Continue with next customer even if one fails
                    continue
        
        logger.info("Evaluation complete")
        return dict(template_scores)
    
    def aggregate_scores(
        self,
        template_scores: Dict[str, List[float]]
    ) -> Dict[str, Dict[str, float]]:
        aggregated = {}
        
        for template_name, scores in template_scores.items():
            if not scores:
                logger.warning(
                    f"No scores collected for template: {template_name}"
                )
                aggregated[template_name] = {
                    "mean": 0.0,
                    "median": 0.0,
                    "std": 0.0,
                    "count": 0
                }
                continue
            
            aggregated[template_name] = {
                "mean": float(statistics.mean(scores)),
                "median": float(statistics.median(scores)),
                "std": float(statistics.stdev(scores)) if len(scores) > 1 else 0.0,
                "count": len(scores)
            }
            
            logger.info(
                f"Template '{template_name}': "
                f"mean={aggregated[template_name]['mean']:.4f}, "
                f"median={aggregated[template_name]['median']:.4f}, "
                f"std={aggregated[template_name]['std']:.4f}"
            )
        
        return aggregated
    
    def find_best_prompt(
        self,
        aggregated_scores: Dict[str, Dict[str, float]]
    ) -> Tuple[str, Dict[str, float]]:
        if not aggregated_scores:
            raise ValueError("No aggregated scores provided")
        
        # Find template with highest mean score
        best_template = max(
            aggregated_scores.items(),
            key=lambda x: x[1]["mean"]
        )
        
        best_name, best_stats = best_template
        
        logger.info(
            f"Best prompt identified: '{best_name}' "
            f"with mean similarity: {best_stats['mean']:.4f}"
        )
        
        return best_template
    
    def save_distilled_prompt(
        self,
        template_name: str,
        template_content: str,
        statistics: Dict[str, float],
        aggregated_all: Dict[str, Dict[str, float]]
    ) -> None:
        output_data = {
            "distilled_prompt": {
                "template_name": template_name,
                "template": template_content,
                "performance_metrics": statistics,
                "selected_at": datetime.now().isoformat()
            },
            "all_templates_evaluation": aggregated_all
        }
        
        with open(self.output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Distilled prompt saved to {self.output_path}")
    
    def distill(self) -> Tuple[str, str, Dict[str, float]]:
        logger.info("Starting prompt distillation workflow")
        
        # Load data
        self.load_train_dataset()
        self.load_prompt_templates()
        
        # Evaluate all templates
        template_scores = self.evaluate_all_templates()
        
        # Aggregate scores
        aggregated_scores = self.aggregate_scores(template_scores)
        
        # Find best prompt
        best_name, best_stats = self.find_best_prompt(aggregated_scores)
        best_template = self.prompt_templates[best_name]
        
        # Save results
        self.save_distilled_prompt(
            best_name,
            best_template,
            best_stats,
            aggregated_scores
        )
        
        logger.info("Prompt distillation workflow complete")
        
        return best_name, best_template, best_stats


def main() -> None:
    try:
        distiller = PromptDistiller()
        best_name, best_template, best_stats = distiller.distill()
        
        print("\n" + "="*70)
        print("PROMPT DISTILLATION RESULTS")
        print("="*70)
        print(f"\nBest Prompt: {best_name}")
        print(f"Mean Similarity: {best_stats['mean']:.4f}")
        print(f"Median Similarity: {best_stats['median']:.4f}")
        print(f"Standard Deviation: {best_stats['std']:.4f}")
        print(f"\nResults saved to: {distiller.output_path}")
        print("="*70 + "\n")
    
    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        print(f"Error: {e}")
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON: {e}")
        print(f"Error: Invalid JSON file - {e}")
    except Exception as e:
        logger.exception("Unexpected error during distillation")
        print(f"Error: {e}")


if __name__ == "__main__":
    main()

