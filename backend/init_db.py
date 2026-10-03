from sqlalchemy import text

from database import engine


def create_core_tables() -> None:
    """One-off helper to create core tables if they don't already exist."""
    ddl_statements = [
        # Companies table
        """
        CREATE TABLE IF NOT EXISTS companies (
            id CHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            industry VARCHAR(255) DEFAULT NULL,
            location VARCHAR(255) DEFAULT NULL,
            products JSON DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """,
        # Users table
        """
        CREATE TABLE IF NOT EXISTS users (
            id CHAR(36) NOT NULL,
            company_id CHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(100) DEFAULT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            credits INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_users_email (email),
            CONSTRAINT fk_users_company
              FOREIGN KEY (company_id) REFERENCES companies(id)
              ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """,
        # Problems (tickets) table
        """
        CREATE TABLE IF NOT EXISTS problems (
            id CHAR(36) NOT NULL,
            company_id CHAR(36) DEFAULT NULL,
            title VARCHAR(255) NOT NULL,
            process_location VARCHAR(255) DEFAULT NULL,
            description TEXT NOT NULL,
            frequency VARCHAR(50) DEFAULT NULL,
            impact VARCHAR(50) DEFAULT NULL,
            extracted_json JSON DEFAULT NULL,
            process_map TEXT DEFAULT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'open',
            standard_statement TEXT DEFAULT NULL,
            resolution_steps JSON DEFAULT NULL,
            benchmark_gap TEXT DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            CONSTRAINT fk_problems_company
              FOREIGN KEY (company_id) REFERENCES companies(id)
              ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """,
    ]

    with engine.begin() as conn:
        for ddl in ddl_statements:
            conn.execute(text(ddl))


if __name__ == "__main__":
    create_core_tables()
    print("Core tables (companies, users, problems) ensured in database.")

