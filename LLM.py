
import json
import os
import time
import requests
from crewai import Agent, Task, Crew, LLM
from pathlib import Path
from typing import Dict, List, TypedDict, Optional
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from RAG_Processing.semantic_chunking import Semantic_Chunker
from RAG_Processing.build_database import buildDB
from FullPipeline import Application
from llama_index.core import SimpleDirectoryReader


# Constants
PROMPT_TEMPLATES_FILE = "prompts/prompt_templates.json"
RETENTION_PROMPT_FILE = "prompts/Retention_strategy_prompt.json"
DEFAULT_CSV_FILE = "TelcoChurn.csv"
MODEL_NAME = "nvidia/nemotron-3-nano-30b-a3b:free"
DEFAULT_MAX_TOKENS = 300
TOP_FEATURES_COUNT = 10
END_POINT= "https://openrouter.ai/api/v1/chat/completions"

load_dotenv()
llm_key = os.getenv("LLM_KEY_1")
llm = LLM(
        model="openrouter/nvidia/nemotron-3-nano-30b-a3b:free",
        api_key=llm_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=0.1
    )

def _retrieve_rag_context(query: str) -> List[str]:
    documents= SimpleDirectoryReader(input_dir="RAG_Processing/documents").load_data()
    semantic_chunker = Semantic_Chunker()
    semantic_chunks = semantic_chunker.chunk_start(documents)
    database = buildDB(semantic_chunks,"Semantic_Chunker")
    results_retriever = database.as_retriever(similarity_top_k=5)
    results = results_retriever.retrieve(query)
    return results
    
    


def _prepare_crewai_input(query: str, context: str) -> str:
    with open(RETENTION_PROMPT_FILE,"r") as f:
        retention_prompt = json.load(f)
    prompt = retention_prompt["retention_prompt"].format(query=query,rag_context_chunks=context)
    agent = Agent(
        role="Telecom Customer Retention Specialist",
        goal="Propose domain specific telecom retention strategies to prevent churn.",
        backstory="You are a Telecom Customer Retention Specialist. You are tasked with proposing retention strategies to prevent churn.",
        llm=llm    
    )
    task = Task(
        description=prompt,
        expected_output="A potential retention strategy that could be applied to the customer returned as a string.",
        agent=agent
    )
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=False
    )
    output = crew.kickoff()
    return str(output)


class State(TypedDict):
    customer_insights_values: Dict[str, Dict[str, float]]
    customer_reasons: List[str]
    input_file_name: str
    retrieved_context: Optional[List[str]]
    crewai_output: List[str]


class ChurnReasoningPipeline:    
    def __init__(
        self,
        state:State,
        prompt_templates_file: str = PROMPT_TEMPLATES_FILE,
        model_name: str = MODEL_NAME,
    ) -> None:
        self.application = Application()
        self.csv_file = state["input_file_name"]
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
            print("Customer insights already exists")
            return state
        
        #Wrap in try except to catch if the predictor function runs twice
        try:
            print("Generating customer insights...")
            customer_json = self.application.predictor(state["input_file_name"])
            customer_values = json.loads(customer_json)
            print("Customer insights generation complete.")
            return {"customer_insights_values": customer_values}
        except Exception as e:
            print(f"Error generating customer insights: {e}")
            return state
    
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
        print("Generating explanation with LLM...")
        reasons_list =[]
        limit=0
        for key,value in customer_insight_values.items():
            if(limit == 1):
                break
            prompt = self.prompt_templates["prompt1"].format(
                customer_data=json.dumps(value)
            )
            model_usage = {"model":MODEL_NAME,"messages":[{"role":"user","content":prompt}]}
            reply = requests.post(END_POINT,headers={"Authorization":f"Bearer {llm_key}"},json=model_usage)
            time.sleep(4)
            generated_text = reply.json()["choices"][0]["message"]["content"]
            reasons_list.append(generated_text)
            limit+=1
                
        return {"customer_reasons": reasons_list}
    
    def rag_retrieval_node(self, state: State) -> Dict:
        if "customer_reasons" not in state:
            raise KeyError("Customer reasons not found in state")
        
        # Extract query from reasoning_node output (combine all reasons or use first)
        customer_reasons = state["customer_reasons"]
        if not customer_reasons:
            raise ValueError("Customer reasons list is empty")
        
        # Combine all reasons into a single query string
        retrieved_context = []
        for i in customer_reasons:
        
            # Call placeholder RAG retrieval function
            chunk_list = _retrieve_rag_context(i)
            chunks = [chunk.node.get_content() for chunk in chunk_list]
            retrieved_context.append(chunks)
            # Rerank the chunks in the retrieved context
            # Add them to the retrieved_context list
            
        
        return {"retrieved_context": retrieved_context}
    
    def crewai_preparation_node(self, state: State) -> Dict:
        if "customer_reasons" not in state:
            raise KeyError("Customer reasons not found in state")
        if "retrieved_context" not in state:
            raise KeyError("Retrieved context not found in state")
        
        # Extract query and context from state
        customer_reasons = state["customer_reasons"]
        retrieved_context = state["retrieved_context"]
        
        if not customer_reasons:
            raise ValueError("Customer reasons list is empty")
        if not retrieved_context:
            raise ValueError("Retrieved context list is empty")
                
       
        crewai_output_list =[]
        retrieved_index =0
        for reason in customer_reasons:
            customer_context = retrieved_context[retrieved_index]
            customer_context = "\n\n".join(customer_context)
            output = _prepare_crewai_input(reason, customer_context)
            crewai_output_list.append(str(output))
            retrieved_index+=1
        return {"crewai_output": crewai_output_list}
    
    def build_graph(self) -> StateGraph:
        graph = StateGraph(State)
        graph.add_node("predict", self.analytical_node)
        graph.add_node("reasoning", self.reasoning_node)
        graph.add_node("rag_retrieval", self.rag_retrieval_node)
        graph.add_node("crewai_preparation", self.crewai_preparation_node)
        
        # Define workflow edges
        graph.add_edge(START, "predict")
        graph.add_edge("predict", "reasoning")
        graph.add_edge("reasoning", "rag_retrieval")
        graph.add_edge("rag_retrieval", "crewai_preparation")
        graph.add_edge("crewai_preparation", END)
        
        return graph.compile()
    
    def run(self, initial_state: Optional[Dict] = None) -> State:
        if initial_state is None:
            initial_state = {"customer_insights_values": {}, "customer_reasons": [],"input_file_name":"TelcoChurn.csv","crewai_output":[]}
        
        flow = self.build_graph()
        result = flow.invoke(initial_state)
        
        return result


def execute_pipeline(initial_state: Optional[Dict] = None) -> State:
    if initial_state is None:
        initial_state = {"customer_insights_values": {}, "customer_reasons": [],"input_file_name":None,"crewai_output":[]}
    if initial_state["input_file_name"] is None:
        raise ValueError("Input file name is required") 
    pipeline_instance = ChurnReasoningPipeline(state=initial_state)
    result = pipeline_instance.run()
    customer_churn=[]
    for i, (key, customer_insight) in enumerate(result["customer_insights_values"].items(), start=1):
        customer_churn.append({
            "id":key,
            "churn_probability": customer_insight['churn_probability']
        })
    customer_data={
        "customer_churn":customer_churn,
    "customer_reasons":result["customer_reasons"],
    "retention_strategies":result["crewai_output"]}
    return customer_data

def main() -> None:
    try:
        initial_state = {"customer_insights_values": {}, "customer_reasons": [],"input_file_name":"TelcoChurn.csv"}
        pipeline_instance = ChurnReasoningPipeline(state=initial_state)
        result = pipeline_instance.run()
        
        # Print churn probabilities of each customer
        for i, customer_insight in enumerate(result["customer_insights_values"], start=1):
            print(f"Churn probability for customer {i}: {customer_insight['churn_probability']}")

        for i, reason in enumerate(result["customer_reasons"], start=1):
            print(f"Response {i}: {reason}")
        for i, output in enumerate(result["crewai_output"], start=1):
            print(f"CrewAI output for customer reason {i}: {output}")
    
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
