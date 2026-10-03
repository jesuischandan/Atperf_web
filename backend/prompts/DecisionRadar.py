from pydantic import BaseModel
import schemas

class DecisionRadarAIResponse(BaseModel):
    diagnostic: str

DECISION_RADAR_SYSTEM_PROMPT = "You are a highly analytical executive advisor parsing problem matrices."

def build_radar_prompt(topics: list[schemas.RadarTopicCreate], language: str) -> str:
    lang_instruction = "Respond entirely in French." if language == "fr" else "Respond entirely in English."
    
    topics_text = "Topics Submitted:\n"
    for t in topics:
        topics_text += f"- {t.name}: Impact={t.impact}, Frequency={t.frequency}, Cross-Functionality={t.cross_functionality}, Anticipation={t.anticipation}\n"
        if t.topic_context:
            topics_text += f"  Topic Context: {t.topic_context}\n"
        if t.rating_context:
            topics_text += f"  Rating Rationale: {t.rating_context}\n"

    return (
        f"You are an executive-level industrial advisor. {lang_instruction}\n"
        "Your goal is to provide a brief, hard-hitting 'Mini-Diagnostic' for an Industrial Director based on their given topics and scores (1-5 scale).\n"
        "Tone: Direct, Executive, Action-Oriented. No fluff. Use strong verbs (Arbitrate, Clarify, Delegate, Accelerate).\n\n"
        "Logic Guidelines:\n"
        "- 'Reactive' Profile: If a topic has High Impact (4-5) and High Frequency (4-5) but Low Anticipation (1-2) -> Advice: Shift from technical fixes to process governance.\n"
        "- 'Silo' Profile: If a topic has High Impact (4-5) but Low Cross-functionality (1-2) -> Advice: Check if the Director is too involved in local issues that should be delegated.\n"
        "- 'Strategic Gap': If a topic has High Cross-functionality (4-5) but Low Anticipation (1-2) -> Advice: This is a STRAP priority. Clarify decision-making rights between departments to stop the drift.\n\n"
        f"{topics_text}\n"
        "Synthesize these topics into a 2-3 paragraph diagnostic. Highlight the 'Red Zones' (High Impact, High Cross-functionality, Low Anticipation) and use the Logic Guidelines to form your advice."
    )
