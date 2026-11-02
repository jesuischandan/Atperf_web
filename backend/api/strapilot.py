import os
import re
from langchain_experimental.agents import create_pandas_dataframe_agent
from langchain_openai import ChatOpenAI
import uuid
import json
import traceback
from datetime import datetime
from typing import List

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc
from openai import OpenAI

from database import get_gcp_db
from security import rate_limit, require_user
import models
import schemas
from prompts.StrAPilot import build_columns_prompt, build_kpi_prompt
from prompts.StrapAnalysis import build_strap_analysis_prompt

router = APIRouter(prefix="/api/strapilot", tags=["StrAPilot"])
client = OpenAI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Authenticated through the session cookie (previously a Bearer header carrying the raw user_id).
get_current_user = require_user


@router.post("/upload", response_model=schemas.StrapilotSessionResponse,
             dependencies=[Depends(rate_limit("ai", 60, 3600))])
async def upload_data(
    file: UploadFile = File(...),
    description: str = Form(...),
    db: Session = Depends(get_gcp_db),
    current_user: models.ExternalUser = Depends(get_current_user),
):
    """
    Accepts CSV/Excel and description. Stores file locally. Creates a DB session.
    """
    try:
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV or Excel files are supported.")
        
        file_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename)[1]
        stored_filename = f"{file_id}_{current_user.user_id}{ext}"
        filepath = os.path.join(UPLOAD_DIR, stored_filename)
        
        with open(filepath, "wb") as f:
            f.write(await file.read())
            
        session = models.StrapilotSession(
            id=file_id,
            user_id=current_user.user_id,
            file_name=file.filename,
            file_path=filepath,
            data_description=description,
            status="uploaded"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/analyze-columns", response_model=schemas.AnalyzedColumnsResponse,
             dependencies=[Depends(rate_limit("ai", 60, 3600))])
async def analyze_columns(
    session_id: str,
    language: str = "en",
    db: Session = Depends(get_gcp_db),
    current_user: models.ExternalUser = Depends(get_current_user)
):
    """
    Read first 50 rows of data, send to LLM to detect headers and describe columns.
    """
    session = db.query(models.StrapilotSession).filter(
        models.StrapilotSession.id == session_id,
        models.StrapilotSession.user_id == current_user.user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    try:
        # Load sample data
        if session.file_name.endswith('.csv'):
            df = pd.read_csv(session.file_path, nrows=50)
        else:
            df = pd.read_excel(session.file_path, nrows=50)
            
        sample_csv = df.to_csv(index=False)
        
        # Build prompt and call LLM
        prompt = build_columns_prompt(sample_data=sample_csv, user_description=session.data_description, language=language)
        
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            response_format=schemas.AnalyzedColumnsResponse,
            messages=[
                {"role": "system", "content": prompt}
            ]
        )
        
        result = response.choices[0].message.parsed.model_dump()
        
        # Update session
        session.has_headers = 1 if result.get("has_headers") else 0
        session.columns_metadata = result.get("columns", [])
        session.status = "columns_analyzed"
        db.commit()
        
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.put("/{session_id}/save-columns", response_model=schemas.StrapilotSessionResponse)
async def save_columns(
    session_id: str,
    payload: schemas.SaveColumnsRequest,
    db: Session = Depends(get_gcp_db),
    current_user: models.ExternalUser = Depends(get_current_user)
):
    """
    Save user-confirmed column metadata.
    """
    session = db.query(models.StrapilotSession).filter(
        models.StrapilotSession.id == session_id,
        models.StrapilotSession.user_id == current_user.user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.columns_metadata = [c.model_dump() for c in payload.columns]
    session.status = "columns_confirmed"
    db.commit()
    db.refresh(session)
    return session

@router.post("/{session_id}/generate-dashboard", response_model=schemas.StrapilotDashboardResponse,
             dependencies=[Depends(rate_limit("ai", 60, 3600))])
async def generate_dashboard(
    session_id: str,
    payload: schemas.GenerateDashboardRequest,
    db: Session = Depends(get_gcp_db),
    current_user: models.ExternalUser = Depends(get_current_user)
):
    """
    Deduct credit, process data, filter 6 months if datetime exist, query LLM for KPI strategy and build dashboard.
    """
    session = db.query(models.StrapilotSession).filter(
        models.StrapilotSession.id == session_id,
        models.StrapilotSession.user_id == current_user.user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # User credit check
    if current_user.credit_balance < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")
        
    try:
        # 1. Load Data
        if session.file_name.endswith('.csv'):
            header = 0 if session.has_headers == 1 else None
            df = pd.read_csv(session.file_path, header=header)
        else:
            header = 0 if session.has_headers == 1 else None
            df = pd.read_excel(session.file_path, header=header)
            
        # Optional: Rename unnamed columns if headers were missing based on metadata
        if session.has_headers == 0 and session.columns_metadata:
            df.columns = [c['name'] for c in session.columns_metadata]

        # Data Cleaning: Drop completely blank columns
        df.dropna(axis=1, how='all', inplace=True)

        # 2. Extract stats
        base_stats = [{"label": "Total Records", "value": f"{len(df):,}"}]
        
        # Detect datetime
        datetime_col = None
        for col_meta in session.columns_metadata:
            if col_meta['type'].lower() == 'datetime':
                datetime_col = col_meta['name']
                break
                
        if datetime_col and datetime_col in df.columns:
            try:
                df[datetime_col] = pd.to_datetime(df[datetime_col])
                latest_date = df[datetime_col].max()
                six_months_ago = latest_date - pd.DateOffset(months=6)
                df = df[df[datetime_col] >= six_months_ago]
                session.date_range_start = six_months_ago
                session.date_range_end = latest_date
                session.datetime_column = datetime_col
            except:
                pass # Ignore if casting fails
                
        # 3. Langchain Pandas Dataframe Agent
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        agent = create_pandas_dataframe_agent(
            llm,
            df,
            verbose=True,
            allow_dangerous_code=True,
            agent_type="tool-calling"
        )
        
        prompt = f"""
You are an expert data analyst. 
Analyze the dataframe and construct a dashboard payload. 
The data description from the user is: {session.data_description}
The requested language is: {payload.language}
The user provided these additional focus answers (if any): {json.dumps(payload.answers) if payload.answers else 'None'}

WARNING: DO NOT LOOP REPEATEDLY. Execute python code once to calculate the data you need, then immediately formulate the Final Answer.

You have tool-calling powers to run Python to calculate insights and charts instead of guessing. Run queries to group by appropriate columns, calculate sums/averages, and construct the exact 'data' arrays.
The payload MUST be a minified raw JSON object with NO markdown formatting, NO backticks, NO explanations outside the JSON.
The JSON must have the following keys:
1. "stats": An array of objects with "label" and "value" (e.g. {{"label": "Total Revenue", "value": "1450"}}).
2. "kpis": An array of objects representing charts. Generate up to 5 KPIs. Each object must have:
   - "title": string
   - "chart_type": string (either "bar" or "line")
   - "explanation": string (why this is useful)
   - "data": An array of objects with "x" and "y" keys. "x" must be a string, "y" must be a float. (e.g. {{"x": "Category A", "y": 480.0}})
3. "open_questions": An array of objects pointing out anomalies, with "column_name" and "question".
4. "overall_analysis": A paragraph summarizing the data.
"""
        response = agent.invoke({"input": prompt})
        output_str = response.get("output", "").strip()
        
        # Robustly extract JSON block using regex
        json_match = re.search(r'(\{.*\})', output_str, re.DOTALL)
        if json_match:
            output_str = json_match.group(1)
        
        try:
            dashboard_payload = json.loads(output_str.strip())
        except json.JSONDecodeError as e:
            traceback.print_exc()
            print(f"Agent Output before crash: {output_str}")
            dashboard_payload = {
                "stats": [],
                "kpis": [],
                "open_questions": [],
                "overall_analysis": "The system encountered an anomaly generating specific insights for this combination of variables, but your records were successfully processed."
            }
        
        # Merge base stats
        if "stats" not in dashboard_payload:
            dashboard_payload["stats"] = []
        dashboard_payload["stats"] = base_stats + dashboard_payload["stats"]
        
        session.dashboard_payload = dashboard_payload
        session.status = "dashboard_ready"
        session.analysis_mode = "dashboard"
        
        # Deduct credit
        current_user.credit_balance -= 1
        
        db.commit()
        return dashboard_payload
        
    except Exception as e:
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Dashboard generation failed: {str(e)}")

@router.post("/{session_id}/generate-strap-analysis", response_model=schemas.StrapAnalysisResponse,
             dependencies=[Depends(rate_limit("ai", 60, 3600))])
async def generate_strap_analysis(
    session_id: str,
    payload: schemas.GenerateStrapAnalysisRequest,
    db: Session = Depends(get_gcp_db),
    current_user: models.ExternalUser = Depends(get_current_user)
):
    """
    Deduct credit, process data, build STRAP prompt, query LLM for the structured 7-block analysis.
    """
    session = db.query(models.StrapilotSession).filter(
        models.StrapilotSession.id == session_id,
        models.StrapilotSession.user_id == current_user.user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # User credit check
    if current_user.credit_balance < 1:
        raise HTTPException(status_code=402, detail="Insufficient credits")
        
    try:
        # Save questionnaire
        session.questionnaire_data = payload.questionnaire.model_dump()
        session.analysis_mode = "strap_analysis"

        # 1. Load Data
        if session.file_name.endswith('.csv'):
            header = 0 if session.has_headers == 1 else None
            df = pd.read_csv(session.file_path, header=header)
        else:
            header = 0 if session.has_headers == 1 else None
            df = pd.read_excel(session.file_path, header=header)
            
        # Optional: Rename unnamed columns if headers were missing based on metadata
        if session.has_headers == 0 and session.columns_metadata:
            df.columns = [c['name'] for c in session.columns_metadata]

        # Data Cleaning: Drop completely blank columns
        df.dropna(axis=1, how='all', inplace=True)

        # 2. Langchain Pandas Dataframe Agent
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        agent = create_pandas_dataframe_agent(
            llm,
            df,
            verbose=True,
            allow_dangerous_code=True,
            agent_type="tool-calling"
        )
        
        prompt = build_strap_analysis_prompt(
            questionnaire_data=session.questionnaire_data,
            columns_meta=session.columns_metadata or [],
            user_description=session.data_description,
            language=payload.language
        )
        
        response = agent.invoke({"input": prompt})
        output_str = response.get("output", "").strip()
        
        # Robustly extract JSON block using regex
        json_match = re.search(r'(\{.*\})', output_str, re.DOTALL)
        if json_match:
            output_str = json_match.group(1)
        
        try:
            analysis_payload = json.loads(output_str.strip())
        except json.JSONDecodeError as e:
            traceback.print_exc()
            print(f"Agent Output before crash: {output_str}")
            analysis_payload = {
                "summary": {
                    "control_level": "ERROR",
                    "control_color": "red",
                    "main_problem": "Failed to generate analysis",
                    "key_lever": "-",
                    "risk": "-",
                    "priority_action": "-"
                },
                "kpi_cards": [],
                "influential_variables": [],
                "weak_signals": [],
                "kpi_to_track": [],
                "risks": [],
                "actions": []
            }
        
        session.strap_analysis_payload = analysis_payload
        session.status = "strap_ready"
        
        # Deduct credit
        current_user.credit_balance -= 1
        
        db.commit()
        return analysis_payload
        
    except Exception as e:
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"STRAP analysis generation failed: {str(e)}")

@router.get("/history", response_model=List[schemas.StrapilotSessionResponse])
async def get_history(
    user_id: str | None = None,
    db: Session = Depends(get_gcp_db),
    current_user: models.ExternalUser = Depends(require_user),
):
    """
    Get the logged-in user's history
    """
    if user_id and user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only view your own history.")
    user_id = current_user.user_id

    sessions = db.query(models.StrapilotSession).filter(
        models.StrapilotSession.user_id == user_id
    ).order_by(desc(models.StrapilotSession.created_at)).all()
    return sessions
