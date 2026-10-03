from database import gcp_engine
from sqlalchemy import text

with gcp_engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE strapilot_sessions ADD COLUMN analysis_mode ENUM('dashboard', 'strap_analysis') DEFAULT 'dashboard';"))
        print("Added analysis_mode")
    except Exception as e:
        print(e)
        
    try:
        conn.execute(text("ALTER TABLE strapilot_sessions ADD COLUMN questionnaire_data JSON;"))
        print("Added questionnaire_data")
    except Exception as e:
        print(e)
        
    try:
        conn.execute(text("ALTER TABLE strapilot_sessions ADD COLUMN strap_analysis_payload JSON;"))
        print("Added strap_analysis_payload")
    except Exception as e:
        print(e)
        
    try:
        conn.execute(text("ALTER TABLE strapilot_sessions MODIFY COLUMN status ENUM('uploaded', 'columns_analyzed', 'columns_confirmed', 'dashboard_ready', 'strap_ready') DEFAULT 'uploaded';"))
        print("Modified status")
    except Exception as e:
        print(e)

print("Done")
