import pandas as pd
df=pd.read_csv('D:\Hackathons\RSOC\Vaishnavi\output\processed_data.csv')
print("Describe command")
print(df.describe())
print("DTYPES")
print(df.dtypes)
print("Is null")
print(df.isnull().sum())