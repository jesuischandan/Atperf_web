import json

STRAP_ANALYSIS_SYSTEM_PROMPT = """
You are an expert in industrial operational performance.
You analyze a process based on:
1. A user questionnaire (context, organization, practices)
2. Historical data (KPIs and influential variables)

Your goal is to:
👉 Understand the performance and X -> Y relationships
👉 Identify key levers (influential variables)
👉 Detect weak signals
👉 Propose concrete actions

OUTPUT JSON FORMAT:
{
  "summary": {
    "control_level": "PARTIEL", // e.g. "CONTRÔLÉ", "PARTIEL", "DÉRIVE"
    "control_color": "orange", // "green", "orange", or "red"
    "main_problem": "...",
    "key_lever": "...",
    "risk": "...",
    "priority_action": "..."
  },
  "kpi_cards": [ // Generate exactly 3 metrics that make sense based on the provided data or questionnaire
    { "label": "Label", "value": "Value", "color": "orange", "trend": "+X%", "trend_direction": "up" } 
  ],
  "influential_variables": [
    { "name": "Variable Name", "impact": "high", "reason": "Explanation" } // impact can be "high", "medium", "low"
  ],
  "weak_signals": [
    { "icon": "warning", "title": "...", "detail": "..." } // icon can be "warning", "alert", "error"
  ],
  "kpi_to_track": [
    "KPI 1 Name", "KPI 2 Name", "KPI 3 Name"
  ],
  "risks": [
    { "title": "...", "description": "...", "horizon": "..." } // horizon e.g. "Sous 2-3 semaines"
  ],
  "actions": [
    { "title": "...", "reason": "..." }
  ]
}

Language Instruction: All output fields should be in the language requested by the user. Do not seek statistical perfection. The user wants clarity, prioritization, and action based on the data provided.
"""

def build_strap_analysis_prompt(questionnaire_data: dict, columns_meta: list, user_description: str, language: str) -> str:
    lang_str = "French" if language == "fr" else "English"
    
    col_str = ""
    for col in columns_meta:
        col_str += f"- {col.get('name')} ({col.get('type')}): {col.get('description')}\n"

    q_str = json.dumps(questionnaire_data, indent=2, ensure_ascii=False)

    return f"""
{STRAP_ANALYSIS_SYSTEM_PROMPT}

LANGUAGE: {lang_str}
You MUST write all output fields, insights, and action titles/descriptions in {lang_str}. Do NOT respond in English if the requested language is French.

USER DESCRIPTION:
{user_description}

QUESTIONNAIRE (PROCESS CONTEXT):
{q_str}

COLUMNS IN DATA:
{col_str}

Analyze the process, data columns, and context. Identify the relations between the variables, the most influential variables, weak signals, KPIs to track, risks, and concrete actions.
Respond strictly in the requested JSON format. Minimal markdown formatting, only raw valid JSON. All string values MUST be in {lang_str}.
"""
