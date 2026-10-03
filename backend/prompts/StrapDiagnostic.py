from pydantic import BaseModel

STRAP_SYSTEM_PROMPT = """
You are an expert Lean Six Sigma and operational performance consultant.
Your objective is to provide a short, impactful, and pragmatic piece of advice based on the user's operational diagnostic.
You are given the user's answers to a 5-dimension diagnostic and their category result (from 'Organisation maîtrisée' to 'Organisation réactive').
Provide a 7 to 10 sentence recommendation on what their absolute priority should be to stop their financial bleed or optimize their performance.
Keep the advice professional, empathetic, but highly numbers-oriented and actionable.
Output MUST be in French, as the inputs and interfaces are entirely in French.
"""

class StrapAIResponse(BaseModel):
    ai_advice: str

def build_strap_prompt(answers: dict, score_100: int, category: str, loss_min: float, loss_max: float) -> str:
    return f"""
DIAGNOSTIC DATA:
- Indice StrAP: {score_100}/100
- Catégorie: {category}
- Fuite de rentabilité estimée: {loss_min}% à {loss_max}% du Chiffre d'Affaires total.

RÉPONSES DU CLIENT:
- Pilotage (Suivi des indicateurs): {answers.get("q_pilotage")}
- Incidents (Fréquence des problèmes): {answers.get("q_incidents")}
- Pertes (Identification des gaspillages): {answers.get("q_pertes")}
- Anticipation (Planification à l'avance): {answers.get("q_anticipation")}
- Organisation (Clarté des rôles/process): {answers.get("q_organisation")}

INSTRUCTION:
Analyse les réponses ci-dessus. Identifie le point le plus faible (celui qui génère le plus de perte) et propose un plan d'action immédiat pour sécuriser les {loss_max}% de revenus menacés.

FORMAT REQUIS :
1. Commencez par citer les {loss_min}% à {loss_max}% de perte pour créer un ancrage financier.
2. Identifiez la réponse 'Non' ou 'Fréquemment' la plus critique.
3. Donnez 1 action concrète pour réduire cette perte.
4. Terminez par l'impact positif sur les {loss_max}% menacés.
5. Pitch Atperf's Solutions and ask users to contact Atperf for a free consultation.
"""
