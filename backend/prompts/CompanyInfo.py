import os
from pydantic import BaseModel, Field
from openai import OpenAI
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class CompanyInfoModel(BaseModel):
    company_ho: Optional[str] = Field(description="The probable head office city and country of the company.")
    industry_sectors: Optional[str] = Field(description="Comma-separated list of industry sectors this company belongs to.")

def guess_company_info(company_name: str, user_location: Optional[str] = None):
    """
    Uses OpenAI to guess a company's head office and its industry sectors.
    """
    try:
        hint = f" The user registering on behalf of this company is located in {user_location}." if user_location else ""
        system_prompt = (
            "You are a corporate entity analysis assistant. Given a company name, "
            "determine its most likely industry sectors (comma-separated, max 3) "
            "and its head office location (city, country, max 50 chars). If the company is well-known, "
            "use its globally recognized head office. If it's ambiguous, use the user's location hint if provided. "
            "If you cannot reasonably guess, leave the fields as None."
        )
        user_prompt = f"Company Name: {company_name}\n{hint}"
        
        completion = openai_client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format=CompanyInfoModel,
            temperature=0.0
        )
        return completion.choices[0].message.parsed
    except Exception as e:
        print(f"Error guessing company info: {e}")
        return None
