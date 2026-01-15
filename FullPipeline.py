import pandas as pd
from Data_Processing import Data_Processing
from Hyperparameter_Tuning import Hyperparameter_Tuning
from ModelInference import ModelInference

class Application():

    def predictor(self,filename):
        print("Starting")
        raw_data = pd.read_csv("TelcoChurn.csv") 
        processor = Data_Processing(raw_data)
        processed_data = processor.processData()
        print("Done with pre processing")
        tuning = Hyperparameter_Tuning(processed_data)
        model,threshold, explainer = tuning.tune()
        print("Done with hyperparameter tuning")
        data = pd.read_csv(filename)
        input_data_processor = Data_Processing(data)
        input_data = input_data_processor.processData()
        insight_generator = ModelInference()
        insights = insight_generator.model_inference(model,threshold,input_data,explainer)
        return insights


run = Application()

run.predictor("TelcoChurn.csv")
        