import logging
import os
from datetime import datetime
from openai import AsyncOpenAI
from passlib.context import CryptContext

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("proextract")

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_staff_id(first_name: str, last_name: str, count: int) -> str:
    """atperf{MM}{YYYY}{first_initial}{lastname}{seq:03d} e.g. atperf032026ckumar001"""
    now    = datetime.now()
    month  = now.strftime("%m")
    year   = now.strftime("%Y")
    prefix = f"atperf{month}{year}{first_name[0].lower()}{last_name.lower()}"
    return f"{prefix}{str(count).zfill(3)}"
