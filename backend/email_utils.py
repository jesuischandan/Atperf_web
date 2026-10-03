import smtplib
from email.message import EmailMessage
import logging
from config import GMAIL_USER, GMAIL_PASSWORD
import os

logger = logging.getLogger("strap.email")

def send_otp_email(to_email: str, otp_code: str):
    """
    Sends a 6-digit OTP code to the specified email address using the SMTP configuration.
    """
    if not GMAIL_USER or not GMAIL_PASSWORD:
        logger.error("Email configuration is missing in environment variables.")
        return False
        
    try:
        msg = EmailMessage()
        msg.set_content(
            f"Hello,\n\n"
            f"Your Atperf verification code is: {otp_code}\n\n"
            f"This code will expire in 15 minutes.\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"Best regards,\nThe Atperf Team"
        )
        msg['Subject'] = 'Your Atperf Verification Code'
        msg['From'] = GMAIL_USER
        msg['To'] = to_email

        server = smtplib.SMTP(os.getenv("MAIL_SERVER", "smtp.gmail.com"), int(os.getenv("MAIL_PORT", 587)))
        if os.getenv("MAIL_STARTTLS", "True").lower() == "true":
            server.starttls()
            
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"OTP email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")
        return False


def notify_admins_new_request(admin_emails: list[str], applicant_name: str, applicant_email: str, request_type: str):
    """
    Sends a notification email to all admins/super_admins when a new account
    request is pending approval.
    
    :param admin_emails: List of admin email addresses to notify.
    :param applicant_name: Full name of the applicant.
    :param applicant_email: Email of the applicant.
    :param request_type: Either 'External User' or 'Internal Staff'.
    """
    if not admin_emails:
        logger.info("No admin emails to notify.")
        return

    if not GMAIL_USER or not GMAIL_PASSWORD:
        logger.error("Email configuration is missing — cannot send admin notifications.")
        return

    try:
        server = smtplib.SMTP(os.getenv("MAIL_SERVER", "smtp.gmail.com"), int(os.getenv("MAIL_PORT", 587)))
        if os.getenv("MAIL_STARTTLS", "True").lower() == "true":
            server.starttls()
        server.login(GMAIL_USER, GMAIL_PASSWORD)

        for admin_email in admin_emails:
            msg = EmailMessage()
            if request_type == "External User":
                msg.set_content(
                    f"Hello,\n\n"
                    f"A new external user has just joined the platform and verified their email on StrAP Tools.\n\n"
                    f"User Details:\n"
                    f"  Name:  {applicant_name}\n"
                    f"  Email: {applicant_email}\n\n"
                    f"This is an informational message. No approval is required.\n\n"
                    f"Best regards,\nThe StrAP Tools Team"
                )
                msg['Subject'] = f"[StrAP Tools] New External User Joined – {applicant_name}"
            else:
                msg.set_content(
                    f"Hello,\n\n"
                    f"A new {request_type} account request is awaiting your approval on StrAP Tools.\n\n"
                    f"Applicant Details:\n"
                    f"  Name:  {applicant_name}\n"
                    f"  Email: {applicant_email}\n"
                    f"  Type:  {request_type}\n\n"
                    f"Please log in to the Admin Panel to review and approve or reject this request.\n\n"
                    f"Best regards,\nThe StrAP Tools Team"
                )
                msg['Subject'] = f"[StrAP Tools] New {request_type} Account Request – {applicant_name}"
                
            msg['From'] = GMAIL_USER
            msg['To'] = admin_email
            server.send_message(msg)
            logger.info(f"Admin notification sent to {admin_email} for new {request_type}: {applicant_email}")

        server.quit()
    except Exception as e:
        logger.error(f"Failed to send admin notification emails: {e}")

import base64

def send_pdf_report_email(to_emails: list[str], cc_emails: list[str], subject: str, body: str, filename: str, pdf_base64: str) -> bool:
    """
    Sends an email with a PDF attachment.
    """
    if not GMAIL_USER or not GMAIL_PASSWORD:
        logger.error("Email configuration is missing in environment variables.")
        return False
        
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = GMAIL_USER
        msg['To'] = ", ".join(to_emails)
        if cc_emails:
            msg['Cc'] = ", ".join(cc_emails)

        # Attach PDF
        pdf_data = base64.b64decode(pdf_base64.split(',')[-1] if ',' in pdf_base64 else pdf_base64)
        msg.add_attachment(pdf_data, maintype='application', subtype='pdf', filename=filename)

        server = smtplib.SMTP(os.getenv("MAIL_SERVER", "smtp.gmail.com"), int(os.getenv("MAIL_PORT", 587)))
        if os.getenv("MAIL_STARTTLS", "True").lower() == "true":
            server.starttls()
            
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"PDF report email sent successfully to {to_emails} (CC: {cc_emails})")
        return True
    except Exception as e:
        logger.error(f"Failed to send PDF report email: {e}")
        return False

def send_contact_email(name: str, email: str, phone: str, company: str, subject: str, message: str) -> bool:
    """
    Sends the contact form submission to c.kumar@atperf.com and r.rahbi@atperf.com
    (using 'r.rabhi@atperf.com' as requested).
    """
    if not GMAIL_USER or not GMAIL_PASSWORD:
        logger.error("Email configuration is missing in environment variables.")
        return False
        
    try:
        msg = EmailMessage()
        
        # Original message from the website contact form
        content = (
            f"New Contact Form Submission\n"
            f"---------------------------\n"
            f"Name:    {name}\n"
            f"Email:   {email}\n"
            f"Phone:   {phone if phone else 'N/A'}\n"
            f"Company: {company if company else 'N/A'}\n\n"
            f"Message:\n{message}\n"
        )
        msg.set_content(content)
        msg['Subject'] = subject
        msg['From'] = GMAIL_USER
        msg['To'] = "c.kumar@atperf.com, r.rabhi@atperf.com"
        
        server = smtplib.SMTP(os.getenv("MAIL_SERVER", "smtp.gmail.com"), int(os.getenv("MAIL_PORT", 587)))
        if os.getenv("MAIL_STARTTLS", "True").lower() == "true":
            server.starttls()
            
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Contact email sent successfully from {name} ({email})")
        return True
    except Exception as e:
        logger.error(f"Failed to send contact email: {e}")
        return False
