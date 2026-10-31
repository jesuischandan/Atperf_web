from fastapi import APIRouter, Depends, HTTPException
import schemas
from email_utils import send_pdf_report_email
from dependencies import openai_client, logger
from security import rate_limit, require_user

router = APIRouter(tags=["Reports"])

# Both endpoints send AI requests or e-mails to arbitrary addresses: logged-in users only, rate limited.
@router.post("/api/reports/email/preview", response_model=schemas.EmailPreviewResponse,
             dependencies=[Depends(require_user), Depends(rate_limit("ai", 60, 3600))])
async def preview_report_email(payload: schemas.EmailPreviewRequest):
    """
    Generates an email subject and body using OpenAI based on the report type and language.
    """
    is_fr = (payload.language.lower() == "fr")
    
    greeting = f"Bonjour {payload.recipient_name or ''}".strip() + "," if is_fr else f"Hello {payload.recipient_name or ''}".strip() + ","
    signoff = "Bien Cordialement,\nStrAP Tools - Atperf" if is_fr else "Best Regards,\nStrAP Tools - Atperf"
    
    default_subject = f"Rapport: {payload.report_title}" if is_fr else f"Report: {payload.report_title}"
    default_body = f"{greeting}\n\nVeuillez trouver ci-joint le rapport.\n\n{payload.overall_outcomes}\n\n{signoff}" if is_fr else f"{greeting}\n\nPlease find attached the report.\n\n{payload.overall_outcomes}\n\n{signoff}"
    
    if not openai_client.api_key or openai_client.api_key == "your_openai_api_key_here":
        return {"subject": default_subject, "body": default_body}

    try:
        lang_str = "French" if is_fr else "English"
        system_prompt = f"You are a professional corporate assistant writing in {lang_str}. Output exactly two sections separated by '---BODY---'. First line is the email subject. Everything after '---BODY---' is the email body."
        
        user_prompt = f"""
Write an email attaching a report titled "{payload.report_title}".
The email MUST start exactly with:
{greeting}

It MUST include a short summary of the outcomes:
{payload.overall_outcomes}

It MUST end exactly with:
{signoff}

Keep the middle text extremely brief and professional.
"""
        completion = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3
        )
        out = completion.choices[0].message.content or ""
        
        if "---BODY---" in out:
            subj, body = out.split("---BODY---", 1)
            return {
                "subject": subj.strip(),
                "body": body.strip()
            }
        else:
            return {"subject": default_subject, "body": out.strip()}
            
    except Exception as e:
        logger.error(f"OpenAI error during email preview generation: {e}")
        return {"subject": default_subject, "body": default_body}

@router.post("/api/reports/email", response_model=schemas.EmailReportResponse,
             dependencies=[Depends(require_user), Depends(rate_limit("report-email", 20, 3600))])
async def send_report_email(payload: schemas.EmailReportRequest):
    """
    Sends a PDF report to requested email addresses using the frontend-provided body verbatim.
    """
    success = send_pdf_report_email(
        to_emails=payload.to_emails,
        cc_emails=payload.cc_emails or [],
        subject=payload.subject,
        body=payload.body,
        filename=payload.filename,
        pdf_base64=payload.pdf_base64
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP credentials.")
    return {"message": "Email sent successfully", "success": True}
