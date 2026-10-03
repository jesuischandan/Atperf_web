# GCP `atperf` Database — Table Descriptions

Database: `atperf` | Host: `34.155.81.181:3306` | Engine: MariaDB

---

## 1. `companies`

Stores client companies registered on the platform.

| Column Name           | Type         | Constraints          | Description                                         |
|-----------------------|--------------|----------------------|-----------------------------------------------------|
| `company_id`          | VARCHAR(36)  | PRIMARY KEY          | Unique identifier for the client company.           |
| `company_name`        | VARCHAR(255) | NOT NULL             | Registered name of the company.                     |
| `tax_id`              | VARCHAR(50)  | None                 | Optional tax/VAT number.                            |
| `industry_sector`     | VARCHAR(100) | None                 | Sector of operation (e.g., Finance, Retail).        |
| `company_ho`          | VARCHAR(255) | None                 | Auto-guessed head office location.                  |
| `plan_type`           | ENUM         | DEFAULT 'free'       | Enum: 'free', 'premium', 'enterprise'.              |
| `company_status`      | ENUM         | DEFAULT 'active'     | Enum: 'active', 'suspended', 'trial_expired'.       |
| `total_credits`       | INT          | DEFAULT 0            | Total AI execution credits across all users.        |
| `max_users`           | INT          | DEFAULT 5            | Max number of allowed accounts under this company.  |
| `billing_contact_email`| VARCHAR(255)| UNIQUE               | Email address dedicated to invoices/billing.        |
| `created_at`          | DATETIME     | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp.                     |
| `updated_at`          | DATETIME     | ON UPDATE CURRENT_TIMESTAMP | Last modification timestamp.                   |

---

## 2. `external_users`

External client users associated with a company.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `user_id` | VARCHAR(36) | PRIMARY KEY | — |
| `company_id` | VARCHAR(36) | NOT NULL, INDEX | — |
| `first_name` | VARCHAR(255) | NOT NULL | — |
| `last_name` | VARCHAR(255) | NOT NULL | — |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | — |
| `password_hash` | VARCHAR(255) | NOT NULL | — |
| `role` | VARCHAR(100) | | `'user'` |
| `status` | ENUM('active','suspended','expired') | | `'active'` |
| `plan_type` | ENUM('free','premium','enterprise') | | `'free'` |
| `credit_balance` | INT | NOT NULL | `0` |
| `last_topup_at` | DATETIME | nullable | — |
| `is_email_verified` | SMALLINT | | `0` |
| `last_login_ip` | VARCHAR(45) | nullable | — |
| `created_at` | DATETIME | | `NOW()` |
| `updated_at` | DATETIME | | `NOW()` (auto-update) |

---

## 3. `internal_users`

Internal Atperf staff accounts.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `staff_id` | VARCHAR(36) | PRIMARY KEY, INDEX | — |
| `first_name` | VARCHAR(255) | NOT NULL | — |
| `last_name` | VARCHAR(255) | NOT NULL | — |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | — |
| `password_hash` | VARCHAR(255) | NOT NULL | — |
| `internal_role` | ENUM('super_admin','developer','admin','collaborator','member') | | `'member'` |
| `permission` | LONGTEXT | nullable | — |
| `mfa_enabled` | SMALLINT | | `0` |
| `mfa_secret` | VARCHAR(255) | nullable | — |
| `is_email_verified` | SMALLINT | | `0` |
| `email_verified_at` | DATETIME | nullable | — |
| `last_login` | DATETIME | nullable | — |
| `status` | ENUM('active','suspended','pending') | | `'pending'` |
| `approved_by` | VARCHAR(36) | nullable | — |
| `created_at` | DATETIME | | `NOW()` |
| `updated_at` | DATETIME | | `NOW()` (auto-update) |
| `deleted_at` | DATETIME | nullable | — |

---

## 4. `problems`

ProExtract tickets submitted by users, enriched by AI.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID |
| `company_id` | VARCHAR(255) | nullable | — |
| `title` | VARCHAR(255) | NOT NULL | — |
| `process_location` | VARCHAR(255) | nullable | — |
| `description` | TEXT | NOT NULL | — |
| `frequency` | VARCHAR(50) | nullable | — |
| `impact` | VARCHAR(50) | nullable | — |
| `extracted_json` | JSON | nullable | — |
| `process_map` | TEXT | nullable | — |
| `status` | VARCHAR(50) | NOT NULL | `'open'` |
| `standard_statement` | TEXT | nullable | — |
| `resolution_steps` | JSON | nullable | — |
| `benchmark_gap` | TEXT | nullable | — |
| `created_at` | DATETIME | NOT NULL | `NOW()` |

---

## 5. `decision_radar_submissions`

Decision Radar analysis sessions submitted by users.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID |
| `user_id` | VARCHAR(255) | nullable | — |
| `language` | VARCHAR(10) | | `'en'` |
| `overall_diagnostic` | TEXT | nullable | — |
| `created_at` | DATETIME | NOT NULL | `NOW()` |

---

## 6. `radar_topics`

Individual topics scored within a Decision Radar submission.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID |
| `submission_id` | VARCHAR(36) | NOT NULL, FK → `decision_radar_submissions.id` | — |
| `name` | VARCHAR(255) | NOT NULL | — |
| `impact` | INT | NOT NULL | — |
| `frequency` | INT | NOT NULL | — |
| `cross_functionality` | INT | NOT NULL | — |
| `anticipation` | INT | NOT NULL | — |

---

## 7. `email_verifications`

Temporary OTP records for email verification (external users & internal staff).

| Column | Type | Constraints | Default |
|---|---|---|---|
| `email` | VARCHAR(255) | PRIMARY KEY | — |
| `otp_hash` | VARCHAR(255) | NOT NULL | — |
| `expires_at` | DATETIME | NOT NULL | — |
| `created_at` | DATETIME | | `NOW()` |

---

## 8. `strapilot_sessions`

StrAPilot data analysis sessions containing data metadata and dashboard configurations.

| Column | Type | Constraints | Default |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID |
| `user_id` | VARCHAR(36) | NOT NULL, FK → `external_users.user_id` | — |
| `file_name` | VARCHAR(255) | NOT NULL | — |
| `file_path` | VARCHAR(500) | NOT NULL | — |
| `data_description` | TEXT | nullable | — |
| `has_headers` | SMALLINT | | `0` |
| `columns_metadata` | JSON | nullable | — |
| `datetime_column` | VARCHAR(255) | nullable | — |
| `date_range_start` | DATETIME | nullable | — |
| `date_range_end` | DATETIME | nullable | — |
| `dashboard_payload` | JSON | nullable | — |
| `status` | ENUM | `'uploaded'` | — |
| `created_at` | DATETIME | NOT NULL | `NOW()` |
| `updated_at` | DATETIME | NOT NULL | `NOW()` (auto-update) |

---

_Last updated: 2026-04-13_
