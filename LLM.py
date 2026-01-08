
import json
import os
import requests
from pathlib import Path
from typing import Dict, List, TypedDict, Optional
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from transformers import pipeline

from FullPipeline import Application


# Constants
PROMPT_TEMPLATES_FILE = "prompts/prompt_templates.json"
DEFAULT_CSV_FILE = "TelcoChurn.csv"
MODEL_NAME = "nvidia/nemotron-3-nano-30b-a3b:free"
DEFAULT_MAX_TOKENS = 300
TOP_FEATURES_COUNT = 10
END_POINT= "https://openrouter.ai/api/v1/chat/completions"

class State(TypedDict):
    customer_insights_values: Dict[str, Dict[str, float]]
    customer_reasons: List[str]


class ChurnReasoningPipeline:    
    def __init__(
        self,
        prompt_templates_file: str = PROMPT_TEMPLATES_FILE,
        csv_file: str = DEFAULT_CSV_FILE,
        model_name: str = MODEL_NAME
    ) -> None:
        self.application = Application()
        self.csv_file = csv_file
        self.prompt_templates = self._load_prompt_templates(prompt_templates_file)        
    def _load_prompt_templates(self, file_path: str) -> Dict:
        prompt_file = Path(file_path)
        if not prompt_file.exists():
            raise FileNotFoundError(f"Prompt templates file not found: {file_path}")
        
        with open(prompt_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    
    def analytical_node(self, state: State) -> Dict:
        existing_customer = state.get("customer_insights_values", {})
        if existing_customer and len(existing_customer) > 0:
            return {"customer_insights_values": existing_customer}
        
        print("Generating customer insights...")
        customer_json = self.application.predictor(self.csv_file)
        customer_values = json.loads(customer_json)
        print("Customer insights generation complete.")
        
        return {"customer_insights_values": customer_values}
    
    def reasoning_node(self, state: State) -> Dict:
        if "customer_insights_values" not in state:
            raise KeyError("Customer insights values not found in state")
        
        customer_insight_values = state["customer_insights_values"]
        
        # Get first customer's SHAP values (assuming structure from ModelInference)
        # Extract top N features for prompt
        if not isinstance(customer_insight_values, dict):
            raise ValueError("Customer insights values must be a dictionary")
        
        # Get first customer key (order may vary, so we take first available)
        first_customer_key = next(iter(customer_insight_values.keys()), None)
        if not first_customer_key:
            raise ValueError("No customer data found in customer insights values")
        
        customer_data = customer_insight_values[first_customer_key]
        shap_feature_values = customer_data.get("shap_feature_values", {})
        
        # Select top features (sorted by absolute value)
        top_features = dict(
            sorted(
                shap_feature_values.items(),
                key=lambda x: abs(x[1]),
                reverse=True
            )[:TOP_FEATURES_COUNT]
        )
        customer_data["shap_feature_values"] = top_features
        if "prompt1" not in self.prompt_templates:
            raise KeyError("Required prompt template 'prompt1' not found")
        load_dotenv()
        llm_key = os.getenv("LLM_KEY_1")
        prompt = self.prompt_templates["prompt1"].format(
            customer_data=json.dumps(customer_data)
        )
        model_usage = {"model":MODEL_NAME,"messages":[{"role":"user","content":prompt}]}
        print("Generating explanation with LLM...")
                
        reply = requests.post(END_POINT,headers={"Authorization":f"Bearer {llm_key}"},json=model_usage)
        
        generated_text = reply.json()["choices"][0]["message"]["content"]
        return {"customer_reasons": [generated_text]}
    
    def build_graph(self) -> StateGraph:
        graph = StateGraph(State)
        graph.add_node("predict", self.analytical_node)
        graph.add_node("reasoning", self.reasoning_node)
        
        # Define workflow edges
        graph.add_edge(START, "predict")
        graph.add_edge("predict", "reasoning")
        graph.add_edge("reasoning", END)
        
        return graph.compile()
    
    def run(self, initial_state: Optional[Dict] = None) -> State:
        if initial_state is None:
            initial_state = {"customer_insights_values": {}, "customer_reasons": []}
        
        flow = self.build_graph()
        result = flow.invoke(initial_state)
        
        return result


def main() -> None:
    try:
        pipeline_instance = ChurnReasoningPipeline()
        result = pipeline_instance.run()
        
        # Print generated reasons
        for i, reason in enumerate(result["customer_reasons"], start=1):
            print(f"Response {i}: {reason}")
    
    except FileNotFoundError as e:
        print(f"Error: File not found - {e}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}")
    except KeyError as e:
        print(f"Error: Missing required key - {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")


if __name__ == "__main__":
    main()
