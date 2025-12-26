import pandas as pd
from Data_Processing import Data_Processing
from Hyperparameter_Tuning import Hyperparameter_Tuning
from ModelInference import ModelInference
from langgraph.graph import StateGraph,START,END

class Application():

    def predictor(self):
        print("Starting")
        raw_data = pd.read_csv("TelcoChurn.csv") 
        processor = Data_Processing(raw_data)
        processed_data = processor.processData()
        print("Done with pre processing")
        tuning = Hyperparameter_Tuning(processed_data)
        model,threshold, explainer = tuning.tune()
        print("Done with hyperparameter tuning")
        data = pd.read_csv("TelcoChurn.csv")
        input_data_processor = Data_Processing(data)
        input_data = input_data_processor.processData()
        insight_generator = ModelInference()
        insight_generator.modelInference(model,threshold,input_data,explainer)


run = Application()

run.predictor()
        