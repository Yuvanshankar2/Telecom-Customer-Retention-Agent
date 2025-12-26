from Data_Processing import Data_Processing
import shap
class ModelInference():
    
    def __init__(self):
        pass
    
    def modelInference(self,model,threshold,input_data,explainer):
        input_data = input_data.drop(columns=["Churn"])
        reasons = {}
        y_predicted = model.predict_proba(input_data)[:,1]
        y_predicted = (y_predicted >= threshold).astype(int)
        print(y_predicted)
        churn_count=0
        for i in y_predicted:
            if(i ==1):
                churn_count+=1
        
        churn_rate = churn_count/len(y_predicted)
        print("Churn Rate: ",churn_rate)
        for i in range(input_data.shape[0]):
            observation = input_data.iloc[[i]]
            features = explainer(observation)
            reasons[f"Customer{i}"] = dict(zip(features.feature_names,features.values[0, : ,1]))

        print(features.values.shape)
        return reasons


         

    


