import numpy as np
import pandas as pd
from scipy.stats import chi2_contingency

class Data_Processing():

    def __init__(self,df):
        self.df= df

    def processData(self,process_mode="training"):
        
        self.df["isElectronic"] = self.df["PaymentMethod"]
        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("isElectronic")] == "Electronic check"):
                self.df.iloc[x,self.df.columns.get_loc("isElectronic")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("isElectronic")] = 0
        self.df["isElectronic"] = self.df["isElectronic"].astype(int)

        self.df["isFiber"] = self.df["InternetService"]
        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("isFiber")] == "Fiber optic"):
                self.df.iloc[x,self.df.columns.get_loc("isFiber")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("isFiber")] = 0
        self.df["isFiber"] = self.df["isFiber"].astype(int)

        self.df["isMonth"] = self.df["Contract"]
        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("isMonth")] == "Month-to-month"):
                self.df.iloc[x,self.df.columns.get_loc("isMonth")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("isMonth")] = 0
        self.df["isMonth"] = self.df["isMonth"].astype(int)

        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("Partner")] == "Yes"):
                self.df.iloc[x,self.df.columns.get_loc("Partner")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("Partner")] = 0
        self.df["Partner"] = self.df["Partner"].astype(int)
        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("Dependents")] == "Yes"):
                self.df.iloc[x,self.df.columns.get_loc("Dependents")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("Dependents")] = 0
        self.df["Dependents"] = self.df["Dependents"].astype(int)
        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("MultipleLines")] == "Yes"):
                self.df.iloc[x,self.df.columns.get_loc("MultipleLines")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("MultipleLines")] = 0
        self.df["MultipleLines"] = self.df["MultipleLines"].astype(int)

        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("OnlineSecurity")] == "Yes"):
                self.df.iloc[x,self.df.columns.get_loc("OnlineSecurity")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("OnlineSecurity")] = 0
        self.df["OnlineSecurity"] = self.df["OnlineSecurity"].astype(int)

        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("OnlineBackup")] == "Yes"):
                self.df.iloc[x,self.df.columns.get_loc("OnlineBackup")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("OnlineBackup")] = 0
        self.df["OnlineBackup"] = self.df["OnlineBackup"].astype(int)
        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("DeviceProtection")] == "Yes"):
                self.df.iloc[x,self.df.columns.get_loc("DeviceProtection")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("DeviceProtection")] = 0
        self.df["DeviceProtection"] = self.df["DeviceProtection"].astype(int)

        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("TechSupport")] == "Yes"):
                self.df.iloc[x,self.df.columns.get_loc("TechSupport")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("TechSupport")] = 0
        self.df["TechSupport"] = self.df["TechSupport"].astype(int)

        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("StreamingTV")] == "Yes"):
                self.df.iloc[x,self.df.columns.get_loc("StreamingTV")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("StreamingTV")] = 0
        self.df["StreamingTV"] = self.df["StreamingTV"].astype(int)

        for x in range(self.df.shape[0]):
            if(self.df.iloc[x,self.df.columns.get_loc("StreamingMovies")] == "Yes"):
                self.df.iloc[x,self.df.columns.get_loc("StreamingMovies")] = 1
            else:
                self.df.iloc[x,self.df.columns.get_loc("StreamingMovies")] = 0
        self.df["StreamingMovies"] = self.df["StreamingMovies"].astype(int)

        if(process_mode == "training"):
            for x in range(self.df.shape[0]):
                if(self.df.iloc[x,self.df.columns.get_loc("Churn")] == "Yes"):
                    self.df.iloc[x,self.df.columns.get_loc("Churn")] = 1
                else:
                    self.df.iloc[x,self.df.columns.get_loc("Churn")] = 0
            self.df["Churn"] = self.df["Churn"].astype(int)
        else:
            self.df["Churn"] = 0
        data = self.df.drop(columns=["customerID","PaperlessBilling","gender","PhoneService","TotalCharges","InternetService","PaymentMethod","Contract","OnlineBackup","DeviceProtection"])
    

        return data