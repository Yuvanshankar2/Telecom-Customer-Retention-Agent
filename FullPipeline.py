import pandas as pd
from Data_Processing import Data_Processing
from Hyperparameter_Tuning import Hyperparameter_Tuning
from ModelInference import ModelInference
import joblib
class Application():
    def __init__(self):
        self.model = joblib.load("trained_model.pkl")
        self.threshold = joblib.load("threshold.pkl")
        self.explainer = joblib.load("explainer.pkl")
    def predictor(self,filename: str):
        print("Starting")
        data = pd.read_csv(filename)
        input_data_processor = Data_Processing(data)
        input_data = input_data_processor.processData(process_mode="inference")
        insight_generator = ModelInference()
        insights = insight_generator.model_inference(self.model,self.threshold,input_data,self.explainer)
        # Debug logging for insights
        import json
        insights_dict = json.loads(insights)
        print(f"[DEBUG] Generated insights for {len(insights_dict)} customers")
        return insights


if __name__ == "__main__":
    run = Application()

    run.predictor("TelcoChurn.csv")
        