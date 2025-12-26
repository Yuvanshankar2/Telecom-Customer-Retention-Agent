#from Data_Processing import processData
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import recall_score, precision_recall_curve,precision_score
from sklearn.inspection import permutation_importance
import matplotlib.pyplot as plt
from sklearn.feature_selection import mutual_info_classif
import pandas as pd
import numpy as np
import optuna
import shap
from sklearn.model_selection import StratifiedKFold, cross_val_score

class Hyperparameter_Tuning():

    def __init__(self,data):
        self.data=data
        

    def load(self):
        self.X = self.data.drop(columns=["Churn"])
        self.y = self.data["Churn"]
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(self.X,self.y, test_size=0.2)

    def objectiveFunction(self,trial):
        self.load()
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(self.X,self.y, test_size=0.2)
        n_estimators = trial.suggest_int("n_estimators",50,300)
        max_depth = trial.suggest_int("max_depth",5,50)
        min_samples_split = trial.suggest_int("min_samples_split",2,50)
        max_features = trial.suggest_int("max_features",1,13)
        model = RandomForestClassifier(n_estimators=n_estimators,max_depth=max_depth, min_samples_split= min_samples_split,max_features=max_features, class_weight="balanced")
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        return cross_val_score(model, self.X_train,self.y_train, cv=cv,scoring="recall").mean()


    def tune(self):

        optimization = optuna.create_study(direction="maximize")

        optimization.optimize(self.objectiveFunction,n_trials=50)

        print("Best parameters: ",optimization.best_params)
        print("Best value: ",optimization.best_value)

        updated_model = RandomForestClassifier(n_estimators=optimization.best_params["n_estimators"],max_depth=optimization.best_params["max_depth"],min_samples_split=optimization.best_params["min_samples_split"],max_features=optimization.best_params["max_features"],class_weight="balanced")

        updated_model.fit(self.X_train,self.y_train)

        X_trained, X_val,y_trained,y_val = train_test_split(self.X_train,self.y_train,test_size=0.2)


        y_pred = updated_model.predict_proba(X_val)[:,1]
        precision,recall,thresholds = precision_recall_curve(y_val,y_pred)

        #plt.plot(recall,precision)
        #plt.show()
        index = np.argmin(np.abs(recall - 0.9))
        optimal_threshold = thresholds[index]
        y_predicted = updated_model.predict_proba(self.X_test)[:,1]
        y_predicted = (y_predicted >= optimal_threshold).astype(int)
        y_predicted_before = updated_model.predict(self.X_test)
        explainer = shap.TreeExplainer(updated_model,X_trained.sample(50,random_state=0))
        values = explainer(self.X_test,check_additivity=False)
        #shap.summary_plot(values,self.X_test)
        print("Recall score without threshold: ",recall_score(self.y_test,y_predicted_before))
        print("Precision score without threshold: ",precision_score(self.y_test,y_predicted_before))

        print("Recall score with threshold: ",recall_score(self.y_test,y_predicted))
        print("Precision score with threshold: ",precision_score(self.y_test,y_predicted))
        print("Threshold value: ", index)

        return updated_model, optimal_threshold, explainer
    
