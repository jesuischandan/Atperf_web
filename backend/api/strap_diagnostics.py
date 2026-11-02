from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_gcp_db
from security import Principal, get_principal, rate_limit, require_user
from dependencies import openai_client, logger
from prompts.StrapDiagnostic import STRAP_SYSTEM_PROMPT, StrapAIResponse, build_strap_prompt

router = APIRouter(tags=["StrapDiagnostic"])

def calc_value(answer_str: str) -> int:
    a = answer_str.lower()
    if 'oui précisément' in a or a == 'oui' or a == 'rarement':
        return 10
    elif 'partiellement' in a or 'parfois' in a or 'approximativement' in a:
        return 5
    elif 'non' in a or 'fréquemment' in a or 'frequemment' in a:
        return 0
    return 5

def calc_penalty(answer_str: str, question: str) -> float:
    a = answer_str.lower()
    factor = 0.0
    if question == "pilotage" and a == "non":
        factor = 0.20
    elif question == "incidents" and ('fréq' in a or 'freq' in a):
        factor = 0.25
    elif question == "pertes" and a == "non":
        factor = 0.15
    elif question == "anticipation" and a == "non":
        factor = 0.20
    elif question == "organisation" and a == "non":
        factor = 0.20
    return factor

@router.post("/analyze-strap", response_model=schemas.StrapDiagnosticResponse,
             dependencies=[Depends(rate_limit("ai", 60, 3600))])
async def analyze_strap(payload: schemas.StrapDiagnosticCreate, gcp_db: Session = Depends(get_gcp_db),
                        principal: Principal = Depends(get_principal)):
    # Anonymous diagnostics stay allowed; a user_id is only honoured for the logged-in user.
    if payload.user_id and (principal.user is None or principal.user.user_id != payload.user_id):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated. Please log in.")
    if principal.user is not None:
        payload.user_id = principal.user.user_id
        payload.company_id = principal.user.company_id
    if payload.user_id:
        user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.user_id == payload.user_id).first()
        if user and user.credit_balance < 1:
            raise HTTPException(status_code=403, detail="Insufficient credits to generate a report.")

    val_p = calc_value(payload.q_pilotage)
    val_i = calc_value(payload.q_incidents)
    val_l = calc_value(payload.q_pertes)
    val_a = calc_value(payload.q_anticipation)
    val_o = calc_value(payload.q_organisation)
    
    score_50 = val_p + val_i + val_l + val_a + val_o
    score_100 = score_50 * 2
    
    if score_100 <= 30:
        category = "Organisation réactive 👉 pertes critiques"
    elif score_100 <= 70:
        category = "Organisation instable 👉 pertes significatives"
    else:
        category = "Organisation maîtrisée 👉 Optimisation possible"
        
    # Using 5% as baseline as interpreted
    base_pct = 7.5
    
    total_penalty = 0.0
    total_penalty += calc_penalty(payload.q_pilotage, "pilotage")
    total_penalty += calc_penalty(payload.q_incidents, "incidents")
    total_penalty += calc_penalty(payload.q_pertes, "pertes")
    total_penalty += calc_penalty(payload.q_anticipation, "anticipation")
    total_penalty += calc_penalty(payload.q_organisation, "organisation")
    
    adjusted_pct = base_pct * (1 + (total_penalty*2))
    loss_pct_min = round(adjusted_pct * 0.8, 1)
    loss_pct_max = round(adjusted_pct * 1.3, 1)
    
    loss_min = 0.0
    loss_max = 0.0
    
    advice = "Aucun conseil IA généré. Veuillez vérifier votre clé API OpenAI."
    
    if openai_client.api_key and openai_client.api_key != "your_openai_api_key_here":
        try:
            prompt = build_strap_prompt(
                answers={
                    "q_pilotage": payload.q_pilotage,
                    "q_incidents": payload.q_incidents,
                    "q_pertes": payload.q_pertes,
                    "q_anticipation": payload.q_anticipation,
                    "q_organisation": payload.q_organisation
                },
                score_100=score_100,
                category=category,
                loss_min=loss_pct_min,
                loss_max=loss_pct_max
            )
            
            completion = await openai_client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": STRAP_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                response_format=StrapAIResponse,
            )
            ai = completion.choices[0].message.parsed
            advice = ai.ai_advice
            logger.info("OpenAI advice generation succeeded for StrAP diag.")
        except Exception as e:
            logger.error("OpenAI error during strap analysis", exc_info=e)
            
    db_strap = models.StrapDiagnosticSubmission(
        user_id=payload.user_id,
        company_id=payload.company_id,
        revenue=payload.revenue,
        q_pilotage=payload.q_pilotage,
        q_incidents=payload.q_incidents,
        q_pertes=payload.q_pertes,
        q_anticipation=payload.q_anticipation,
        q_organisation=payload.q_organisation,
        score_50=score_50,
        score_100=score_100,
        loss_estimation_min=loss_min,
        loss_estimation_max=loss_max,
        loss_pct_min=loss_pct_min,
        loss_pct_max=loss_pct_max,
        category_result=category,
        ai_advice=advice
    )
    gcp_db.add(db_strap)
    
    if payload.user_id:
        user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.user_id == payload.user_id).first()
        if user and user.credit_balance > 0:
            user.credit_balance -= 1
            user.total_reports_generated += 1
            
    gcp_db.commit()
    gcp_db.refresh(db_strap)
    
    return db_strap

@router.get("/api/strap-diagnostics/history", response_model=List[schemas.StrapDiagnosticResponse])
async def get_strap_history(user_id: Optional[str] = None, gcp_db: Session = Depends(get_gcp_db),
                            current_user: models.ExternalUser = Depends(require_user)):
    if user_id and user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own history.")
    user_id = current_user.user_id
    diagnostics = gcp_db.query(models.StrapDiagnosticSubmission)\
        .filter(models.StrapDiagnosticSubmission.user_id == user_id)\
        .order_by(models.StrapDiagnosticSubmission.created_at.desc())\
        .all()
    return diagnostics
