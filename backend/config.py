import os
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv("MAIL_USERNAME")
GMAIL_PASSWORD = os.getenv("MAIL_PASSWORD")