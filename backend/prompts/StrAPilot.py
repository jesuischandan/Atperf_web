from pydantic import BaseModel
from typing import List, Optional

# --- Prompt 1: Column Detection ---

class KpiOutput(BaseModel):
    title: str
    chart_type: str
    x_column: str
    y_column: str
    aggregation: str
    explanation: str

class OpenQuestionOutput(BaseModel):
    column_name: str
    question: str

class KpiStrategyResponse(BaseModel):
    kpis: List[KpiOutput]
    overall_analysis: str
    open_questions: List[OpenQuestionOutput] = []

STRAPILOT_COLUMNS_SYSTEM_PROMPT = """
You are an expert Data Analyst. Your task is to analyze the first 50 rows of a dataset and a user-provided description to detect the columns, their types, and write a short description of what each column represents.

The dataset might or might not have header rows. You must determine if the first row is a header.
You must return the result as a structured JSON object.

Language Instruction: All "description" fields you generate must be in the requested language (English or French).

JSON Schema:
{
  "has_headers": true/false,
  "columns": [
    {
      "name": "column name (or auto-generated Column 1, Column 2 if no headers)",
      "type": "string / integer / float / datetime / boolean",
      "description": "Short explanation of what this data is based on the user description and sample data"
    }
  ]
}
"""

def build_columns_prompt(sample_data: str, user_description: str, language: str) -> str:
    lang_str = "French" if language == "fr" else "English"
    return f"""
{STRAPILOT_COLUMNS_SYSTEM_PROMPT}

LANGUAGE: {lang_str}
You MUST write all column descriptions in {lang_str}. Do NOT respond in English if the requested language is French.

USER DESCRIPTION OF DATA:
{user_description}

FIRST 50 ROWS OF DATA (CSV FORMAT):
{sample_data}

Please respond with the JSON object describing the columns, with descriptions written in {lang_str}.
"""


# --- Prompt 2: KPI Strategy & Analysis ---

STRAPILOT_KPI_SYSTEM_PROMPT = """
You are an expert Business Intelligence Dashboard Designer and Lean Management Consultant.
Based on the metadata of a dataset (column names, types, descriptions), summary statistics, and the user's focus description, you need to design a dashboard with 2-3 key performance KPIs.

CHART TYPES RULES:
- Time-series data (evolution over time) -> use "line" chart.
- Categorical comparisons (volumes, sums by category) -> use "bar" chart.
- Do NOT use pie charts unless absolutely necessary for a strict composition (sum to 100%).
- If a column is important but its data type is unclear or not fit for standard charting, you must add it to "open_questions" to ask the user.

OUTPUT JSON FORMAT:
{
  "kpis": [
    {
      "title": "Title of the chart",
      "chart_type": "line" | "bar",
      "x_column": "exact name of the column for X axis",
      "y_column": "exact name of the column for Y axis (must be numeric)",
      "aggregation": "sum" | "avg" | "count" | "max" | "min",
      "explanation": "Short, actionable explanation of what this chart shows and why it matters."
    }
  ],
  "overall_analysis": "A brief, 3-5 sentence overall analysis of the dataset, highlighting potential areas of concern or operational insights based on the available metrics.",
  "open_questions": [
    {
      "column_name": "name",
      "question": "A question to the user asking them to clarify what this column represents or how it should be analyzed."
    }
  ]
}

Language Instruction: All "title", "explanation", "overall_analysis", and "question" fields must be in the requested language.
"""

def build_kpi_prompt(columns_meta: list, user_description: str, language: str, user_answers: Optional[dict] = None) -> str:
    lang_str = "French" if language == "fr" else "English"
    
    col_str = ""
    for col in columns_meta:
        col_str += f"- {col.get('name')} ({col.get('type')}): {col.get('description')}\n"

    answers_str = ""
    if user_answers:
        answers_str = "\nADDITIONAL CONTEXT FROM USER PREVIOUSLY ASKED OPEN QUESTIONS:\n"
        for col, answer in user_answers.items():
            if answer.strip():
                answers_str += f"- Context regarding '{col}': {answer}\n"
    
    return f"""
LANGUAGE: {lang_str}

USER DESCRIPTION:
{user_description}

COLUMNS SHAPE:
{col_str}{answers_str}

Analyze the columns and design 2 to 3 impactful KPI charts. 
If there's a datetime column, make sure to suggest at least one time-series trend (line chart).
Respond with the JSON format strictly.
"""
