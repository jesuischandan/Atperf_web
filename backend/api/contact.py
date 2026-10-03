from fastapi import APIRouter, HTTPException
import schemas
from email_utils import send_contact_email
from dependencies import openai_client, logger

router = APIRouter(tags=["Contact"])

@router.post("/api/contact")
async def handle_contact_form(payload: schemas.ContactFormRequest):
    """
    Receives contact form submissions, uses OpenAI to generate a subject line based on the message,
    and sends an email to the configured admins.
    """
    subject = f"Contact Form Submission from {payload.name}"
    
    # Use OpenAI to rewrite the subject if available
    if openai_client.api_key and openai_client.api_key != "your_openai_api_key_here":
        try:
            prompt = (
                f"You are given a message from a contact form submitted by {payload.name}. "
                "Write a short, engaging, and professional email subject line (under 10 words) "
                "that summarizes the intent of this message. Do not include quotes around the subject line.\n\n"
                f"Message: {payload.message}"
            )
            completion = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates professional email subjects."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3
            )
            ai_subject = completion.choices[0].message.content.strip().strip('"').strip("'")
            if ai_subject:
                # Based on user request, subject pattern: "{name} - {rewritten_subject}"
                subject = f"{payload.name} - {ai_subject}"
        except Exception as e:
            logger.error(f"OpenAI error during subject generation: {e}")
            
    success = send_contact_email(
        name=payload.name,
        email=payload.email,
        phone=payload.phone or "",
        company=payload.company or "",
        subject=subject,
        message=payload.message
    )
    
    if not success:
         raise HTTPException(status_code=500, detail="Failed to send contact email.")
         
    return {"message": "Message sent successfully", "success": True}
