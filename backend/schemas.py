from datetime import datetime
from typing import Optional, List
import uuid

from pydantic import BaseModel, ConfigDict



class CompanyBase(BaseModel):
    company_name: str
    industry_sector: Optional[str] = None
    company_ho: Optional[str] = None
    tax_id: Optional[str] = None
    billing_contact_email: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyResponse(CompanyBase):
    company_id: str
    plan_type: str
    company_status: str
    total_credits: int
    max_users: int
    maintenance_pilot: Optional[int] = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    industry_sector: Optional[str] = None
    company_ho: Optional[str] = None
    tax_id: Optional[str] = None
    billing_contact_email: Optional[str] = None
    plan_type: Optional[str] = None
    company_status: Optional[str] = None
    total_credits: Optional[int] = None
    max_users: Optional[int] = None
    maintenance_pilot: Optional[int] = None


class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: str


class UserCreate(UserBase):
    password: str
    company_name: Optional[str] = None
    company_industry: Optional[str] = None
    location: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(UserBase):
    user_id: str
    company_id: str
    role: Optional[str] = None
    status: str
    plan_type: str = "free"
    credit_balance: int = 0
    total_reports_generated: int = 0
    is_email_verified: int = 0
    created_at: datetime
    company_name: Optional[str] = None
    maintenance_pilot: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class StrapDiagnosticCreate(BaseModel):
    user_id: Optional[str] = None
    company_id: Optional[str] = None
    revenue: int = 0

    q_pilotage: str
    q_incidents: str
    q_pertes: str
    q_anticipation: str
    q_organisation: str


class StrapDiagnosticResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[str] = None
    company_id: Optional[str] = None

    revenue: int

    q_pilotage: str
    q_incidents: str
    q_pertes: str
    q_anticipation: str
    q_organisation: str

    score_50: int
    score_100: int

    loss_estimation_min: float
    loss_estimation_max: float
    loss_pct_min: Optional[float] = None
    loss_pct_max: Optional[float] = None

    category_result: str
    ai_advice: str

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- OTP Verification Schemas ---
class OTPSend(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: str

class PasswordResetRequest(BaseModel):
    email: str
    otp: str
    new_password: str

# --- Internal Staff (InternalUser) Schemas ---
class StaffBase(BaseModel):
    first_name: str
    last_name: str
    email: str

class StaffCreate(StaffBase):
    password: str

class StaffLogin(BaseModel):
    email: str
    password: str

class StaffResponse(StaffBase):
    staff_id: str
    internal_role: str
    status: str
    mfa_enabled: int = 0
    is_email_verified: int = 0
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Decision Radar Schemas ---
class RadarTopicBase(BaseModel):
    name: str
    topic_context: Optional[str] = None
    rating_context: Optional[str] = None
    impact: int
    frequency: int
    cross_functionality: int
    anticipation: int

class RadarTopicCreate(RadarTopicBase):
    pass

class RadarTopicResponse(RadarTopicBase):
    id: uuid.UUID
    submission_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)

class DecisionRadarCreate(BaseModel):
    user_id: str
    language: str = "en"
    topics: list[RadarTopicCreate]

class DecisionRadarResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[str] = None
    language: str
    overall_diagnostic: Optional[str] = None
    created_at: datetime
    topics: list[RadarTopicResponse]

    model_config = ConfigDict(from_attributes=True)

class EmailPreviewRequest(BaseModel):
    report_type: str # "proextract" or "decision_radar"
    language: str = "en"
    recipient_name: str = ""
    report_title: str = ""
    overall_outcomes: str = ""

class EmailPreviewResponse(BaseModel):
    subject: str
    body: str

# Update EmailReportRequest to no longer need to be modified by backend
class EmailReportRequest(BaseModel):
    to_emails: List[str]
    cc_emails: Optional[List[str]] = None
    subject: str
    body: str
    filename: str
    pdf_base64: str  # The base64-encoded PDF content

class EmailReportResponse(BaseModel):
    message: str
    success: bool

# --- Contact Form Schema ---
class ContactFormRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    message: str

# --- Use Cases Schemas ---
class UseCaseCommentBase(BaseModel):
    author_name: str
    content: str

class UseCaseCommentCreate(UseCaseCommentBase):
    pass

class UseCaseCommentResponse(UseCaseCommentBase):
    id: uuid.UUID
    use_case_id: uuid.UUID
    created_at: datetime
    author_reply: Optional[str] = None
    author_replied_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class UseCaseCommentReplyCreate(BaseModel):
    reply_content: str

class UseCaseBase(BaseModel):
    title: str
    content: str
    company_name: Optional[str] = None
    publisher_name: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "published"

class UseCaseCreate(UseCaseBase):
    pass

class UseCaseUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    company_name: Optional[str] = None
    publisher_name: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

class UseCaseResponse(UseCaseBase):
    id: uuid.UUID
    likes_count: int
    created_at: datetime
    updated_at: datetime
    comments: List[UseCaseCommentResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- StrAPilot Schemas ---
class ColumnMetadata(BaseModel):
    name: str
    type: str
    description: str

class AnalyzedColumnsResponse(BaseModel):
    has_headers: bool
    columns: List[ColumnMetadata]

class SaveColumnsRequest(BaseModel):
    columns: List[ColumnMetadata]

class GenerateDashboardRequest(BaseModel):
    language: str = "en"
    answers: Optional[dict] = None

class OpenQuestion(BaseModel):
    column_name: str
    question: str

class StrapilotDashboardResponse(BaseModel):
    stats: List[dict]
    kpis: List[dict]
    open_questions: List[OpenQuestion] = []
    overall_analysis: str

class StrapilotSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: str
    file_name: str
    data_description: Optional[str] = None
    has_headers: int
    columns_metadata: Optional[List[ColumnMetadata]] = None
    datetime_column: Optional[str] = None
    dashboard_payload: Optional[dict] = None
    analysis_mode: str
    questionnaire_data: Optional[dict] = None
    strap_analysis_payload: Optional[dict] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StrapQuestionnaireData(BaseModel):
    process_type: str
    custom_process_type: Optional[str] = None
    objective: str
    constraint_org: str
    constraint_res: str
    constraint_env: str
    current_kpis: str

class GenerateStrapAnalysisRequest(BaseModel):
    language: str = "en"
    questionnaire: StrapQuestionnaireData

class StrapAnalysisResponse(BaseModel):
    summary: dict
    kpi_cards: List[dict]
    influential_variables: List[dict]
    weak_signals: List[dict]
    kpi_to_track: List[str]
    risks: List[dict]
    actions: List[dict]

