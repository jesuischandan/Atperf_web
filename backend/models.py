from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, Integer, func, SmallInteger, Float
from sqlalchemy.dialects.mysql import JSON, LONGTEXT
from sqlalchemy.orm import relationship
import uuid
from database import GCPBase


# ─────────────────────────────────────────────────────────────────────────────
# GCP atperf DB — internal_users table
# ─────────────────────────────────────────────────────────────────────────────
class InternalUser(GCPBase):
    __tablename__ = "internal_users"

    staff_id          = Column(String(36),   primary_key=True, index=True)
    first_name        = Column(String(255),  nullable=False)
    last_name         = Column(String(255),  nullable=False)
    email             = Column(String(255),  nullable=False, unique=True, index=True)
    password_hash     = Column(String(255),  nullable=False)
    internal_role     = Column(
        Enum('super_admin', 'developer', 'admin', 'collaborator', 'member'),
        default='member'
    )
    permission        = Column(LONGTEXT,     nullable=True)
    mfa_enabled       = Column(SmallInteger, default=0)
    mfa_secret        = Column(String(255),  nullable=True)
    is_email_verified = Column(SmallInteger, default=0)
    email_verified_at = Column(DateTime,     nullable=True)
    last_login        = Column(DateTime,     nullable=True)
    status            = Column(
        Enum('active', 'suspended', 'pending'),
        default='pending'
    )
    approved_by       = Column(String(36),   nullable=True)
    created_at        = Column(DateTime,     server_default=func.now())
    updated_at        = Column(DateTime,     server_default=func.now(), onupdate=func.now())
    deleted_at        = Column(DateTime,     nullable=True)

    def __repr__(self):
        return f"<InternalUser(staff_id={self.staff_id}, role={self.internal_role})>"

# ─────────────────────────────────────────────────────────────────────────────
# GCP atperf DB — companies table
# ─────────────────────────────────────────────────────────────────────────────
class GCPCompany(GCPBase):
    __tablename__ = "companies"

    company_id             = Column(String(36),  primary_key=True, index=True)
    company_name           = Column(String(255), nullable=False)
    tax_id                 = Column(String(50),  nullable=True)
    industry_sector        = Column(String(100), nullable=True)
    company_ho             = Column(String(255), nullable=True)
    plan_type              = Column(Enum('free', 'premium', 'enterprise'), default='free')
    company_status         = Column(Enum('active', 'suspended', 'trial_expired'), default='active')
    total_credits          = Column(Integer,     default=0)
    max_users              = Column(Integer,     default=5)
    billing_contact_email  = Column(String(255), nullable=True, unique=True)
    created_at             = Column(DateTime,    server_default=func.now())
    updated_at             = Column(DateTime,    server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<GCPCompany(company_id={self.company_id}, name={self.company_name})>"


# ─────────────────────────────────────────────────────────────────────────────
# GCP atperf DB — external_users table
# ─────────────────────────────────────────────────────────────────────────────
class ExternalUser(GCPBase):
    __tablename__ = "external_users"

    user_id           = Column(String(36),  primary_key=True, index=True)
    company_id        = Column(String(36),  nullable=False, index=True)
    first_name        = Column(String(255), nullable=False)
    last_name         = Column(String(255), nullable=False)
    email             = Column(String(255), nullable=False, unique=True, index=True)
    password_hash     = Column(String(255), nullable=False)
    role              = Column(String(100), default='user')
    status            = Column(Enum('active', 'suspended', 'expired'), default='active')
    plan_type         = Column(Enum('free', 'premium', 'enterprise'), default='free')
    credit_balance    = Column(Integer,     nullable=False, default=0)
    last_topup_at     = Column(DateTime,    nullable=True)
    total_reports_generated = Column(Integer, default=0)
    is_email_verified = Column(SmallInteger, default=0)
    last_login_ip     = Column(String(45),  nullable=True)
    created_at        = Column(DateTime,    server_default=func.now())
    updated_at        = Column(DateTime,    server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ExternalUser(user_id={self.user_id}, email={self.email})>"


# ─────────────────────────────────────────────────────────────────────────────
# GCP atperf DB — problems, email verifications, radar
# ─────────────────────────────────────────────────────────────────────────────

class StrapDiagnosticSubmission(GCPBase):
    __tablename__ = "strap_diagnostics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), nullable=True)
    company_id = Column(String(255), nullable=True)

    revenue = Column(Integer, default=0)

    q_pilotage = Column(String(50))
    q_incidents = Column(String(50))
    q_pertes = Column(String(50))
    q_anticipation = Column(String(50))
    q_organisation = Column(String(50))

    score_50 = Column(Integer)
    score_100 = Column(Integer)

    loss_estimation_min = Column(Integer)
    loss_estimation_max = Column(Integer)
    
    loss_pct_min = Column(Float, nullable=True)
    loss_pct_max = Column(Float, nullable=True)

    category_result = Column(String(100))
    ai_advice = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EmailVerification(GCPBase):
    __tablename__ = "email_verifications"

    email = Column(String(255), primary_key=True)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class DecisionRadarSubmission(GCPBase):
    __tablename__ = "decision_radar_submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), nullable=True)  # references GCP external_users.user_id
    language = Column(String(10), default="en")
    overall_diagnostic = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    topics = relationship("RadarTopic", back_populates="submission", cascade="all, delete-orphan")

class RadarTopic(GCPBase):
    __tablename__ = "radar_topics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("decision_radar_submissions.id"), nullable=False)
    name = Column(String(255), nullable=False)
    topic_context = Column(Text, nullable=True)
    rating_context = Column(Text, nullable=True)
    impact = Column(Integer, nullable=False)
    frequency = Column(Integer, nullable=False)
    cross_functionality = Column(Integer, nullable=False)
    anticipation = Column(Integer, nullable=False)

    submission = relationship("DecisionRadarSubmission", back_populates="topics")

class UseCase(GCPBase):
    __tablename__ = "use_cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True) # supports image or video path
    company_name = Column(String(255), nullable=True)
    publisher_name = Column(String(255), nullable=True)
    likes_count = Column(Integer, default=0)
    status = Column(Enum('published', 'draft'), default='published')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    comments = relationship("UseCaseComment", back_populates="use_case", cascade="all, delete-orphan")


class UseCaseComment(GCPBase):
    __tablename__ = "use_case_comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    use_case_id = Column(String(36), ForeignKey("use_cases.id"), nullable=False)
    author_name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    author_reply = Column(Text, nullable=True)
    author_replied_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    use_case = relationship("UseCase", back_populates="comments")

class StrapilotSession(GCPBase):
    __tablename__ = "strapilot_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False) # references external_users.user_id
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False) # Server-side stored path
    data_description = Column(Text, nullable=True)
    has_headers = Column(SmallInteger, default=0)
    columns_metadata = Column(JSON, nullable=True) # JSON list of detected columns
    datetime_column = Column(String(255), nullable=True)
    date_range_start = Column(DateTime, nullable=True)
    date_range_end = Column(DateTime, nullable=True)
    dashboard_payload = Column(JSON, nullable=True) # Full dashboard config
    analysis_mode = Column(Enum('dashboard', 'strap_analysis'), default='dashboard') # Mode of analysis
    questionnaire_data = Column(JSON, nullable=True) # STRAP questionnaire answers
    strap_analysis_payload = Column(JSON, nullable=True) # STRAP 7-block output
    status = Column(Enum('uploaded', 'columns_analyzed', 'columns_confirmed', 'dashboard_ready', 'strap_ready'), default='uploaded')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())