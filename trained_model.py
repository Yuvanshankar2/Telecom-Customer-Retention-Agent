import joblib
import pandas as pd
from Data_Processing import Data_Processing
from Hyperparameter_Tuning import Hyperparameter_Tuning

data = pd.read_csv("TelcoChurn.csv")
processor = Data_Processing(data)
processed_data = processor.processData(process_mode="training")
tuning = Hyperparameter_Tuning(processed_data)
model,threshold, explainer = tuning.tune()
joblib.dump(model, "trained_model.pkl")
joblib.dump(threshold, "threshold.pkl")
joblib.dump(explainer, "explainer.pkl")
