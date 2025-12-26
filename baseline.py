import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import recall_score,precision_score
from Data_Processing import Data_Processing
baseline_data = pd.read_csv("TelcoChurn.csv")
processor = Data_Processing(baseline_data)
processed_baseline_data = processor.processData()
model = LogisticRegression(max_iter=500)
y = processed_baseline_data["Churn"]
X = processed_baseline_data.drop(columns=["Churn"])
X_train,X_test,y_train,y_test = train_test_split(X,y,test_size=0.2)

model.fit(X_train,y_train)

prediction = model.predict(X_test)

churn_count= 0
for i in prediction:
    if(i == 1):
        churn_count+=1
churn_rate  = churn_count/len(prediction)
print("Churn Rate: ", churn_rate)
print("Baseline recall score: ",recall_score(y_test,prediction))


