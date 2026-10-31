from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from sqlalchemy.orm import Session

import models
import schemas
from database import get_gcp_db
from security import rate_limit, require_user
from dependencies import openai_client, logger
from prompts.DecisionRadar import DECISION_RADAR_SYSTEM_PROMPT, DecisionRadarAIResponse, build_radar_prompt

router = APIRouter(tags=["Decision Radar"])

@router.get("/api/decision-radar/history", response_model=list[schemas.DecisionRadarResponse])
def get_radar_history(user_id: Optional[str] = None, skip: int = 0, limit: int = 50, gcp_db: Session = Depends(get_gcp_db),
                      current_user: models.ExternalUser = Depends(require_user)):
    """Fetch the logged-in user's Decision Radar submission history."""
    if user_id and user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own history.")
    query = gcp_db.query(models.DecisionRadarSubmission).filter(
        models.DecisionRadarSubmission.user_id == current_user.user_id
    )
    submissions = (
        query
        .order_by(models.DecisionRadarSubmission.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return submissions


@router.post("/api/decision-radar/analyze", response_model=schemas.DecisionRadarResponse,
             dependencies=[Depends(rate_limit("ai", 60, 3600))])
async def analyze_decision_radar(payload: schemas.DecisionRadarCreate, gcp_db: Session = Depends(get_gcp_db),
                                 current_user: models.ExternalUser = Depends(require_user)):
    # The session decides who is submitting, never the request body.
    payload.user_id = current_user.user_id
    try:
        # Require authenticated user
        if not payload.user_id:
            logger.warning("Decision Radar analyze failed: Missing user_id in payload.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login required to use Decision Radar.")
        
        user = gcp_db.query(models.ExternalUser).filter(models.ExternalUser.user_id == payload.user_id).first()
        if not user:
            logger.warning(f"Decision Radar analyze failed: User {payload.user_id} not found in GCP DB.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user. Please log in again.")

        if user.credit_balance < 1:
            raise HTTPException(status_code=403, detail="Insufficient credits to generate a radar diagnostic.")

        diagnostic_text = "Analysis unavailable at this time."

        if openai_client.api_key and openai_client.api_key != "your_openai_api_key_here":
            try:
                prompt = build_radar_prompt(payload.topics, payload.language)

                completion = await openai_client.beta.chat.completions.parse(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": DECISION_RADAR_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    response_format=DecisionRadarAIResponse,
                )
                ai = completion.choices[0].message.parsed
                diagnostic_text = ai.diagnostic
                logger.info("Decision radar analysis succeeded.")
            except Exception as e:
                logger.error("OpenAI error during radar analysis", exc_info=e)
                diagnostic_text = "System error: unable to generate AI diagnostic. High impact issues with low anticipation require immediate governance review."

        # Save to database
        submission = models.DecisionRadarSubmission(
            user_id=payload.user_id,
            language=payload.language,
            overall_diagnostic=diagnostic_text
        )
        gcp_db.add(submission)
        
        user.credit_balance -= 1
        user.total_reports_generated += 1
        gcp_db.flush()

        for idx, topic in enumerate(payload.topics):
            db_topic = models.RadarTopic(
                submission_id=submission.id,
                name=topic.name,
                topic_context=topic.topic_context,
                rating_context=topic.rating_context,
                impact=topic.impact,
                frequency=topic.frequency,
                cross_functionality=topic.cross_functionality,
                anticipation=topic.anticipation
            )
            gcp_db.add(db_topic)

        gcp_db.commit()
        gcp_db.refresh(submission)
        return submission

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unhandled exception in /api/decision-radar/analyze", exc_info=e)
        raise HTTPException(status_code=500, detail="Internal server error during analysis.")
