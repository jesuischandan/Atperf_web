import os
import pandas as pd
from langchain_experimental.agents import create_pandas_dataframe_agent
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# Create a dummy DataFrame
df = pd.DataFrame({
    'date': pd.date_range(start='1/1/2026', periods=10),
    'category': ['A', 'B', 'A', 'B', 'C', 'A', 'A', 'B', 'B', 'C'],
    'revenue': [100, 200, 150, 50, 300, 120, 110, 80, 90, 350],
    'losses': [10, 5, 12, 50, 0, 8, 15, 40, 30, 0]
})

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

agent = create_pandas_dataframe_agent(
    llm,
    df,
    verbose=True,
    allow_dangerous_code=True,
    agent_type="tool-calling"
)

prompt = """
You are an expert data analyst. 
Analyze the dataframe and construct a dashboard payload. 
The payload MUST be a minified raw JSON object with NO markdown formatting, NO backticks, NO explanations outside the JSON.
The JSON must have the following keys:
1. "stats": An array of objects with "label" and "value" (e.g. {"label": "Total Revenue", "value": "1450"}).
2. "kpis": An array of objects representing charts. Each object must have:
   - "title": string (e.g. "Revenue by Category")
   - "chart_type": string (either "bar" or "line")
   - "explanation": string (why this is useful)
   - "data": An array of objects with "x" and "y" keys. "x" must be a string, "y" must be a float. (e.g. {"x": "A", "y": 480.0})
3. "open_questions": An array of objects with "column_name" and "question" pointing out anomalies.
4. "overall_analysis": A paragraph summarizing the data.

Generate 2 KPIs.
"""

response = agent.invoke({"input": prompt})
print("RAW RESPONSE:")
print(response["output"])
