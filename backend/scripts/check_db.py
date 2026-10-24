"""Verify the database connection. Usage:  python scripts/check_db.py   (exit code 0 = OK)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # allow running from any directory

from sqlalchemy import inspect, text

from app.core.config import get_settings
from app.db.session import get_engine


def main() -> int:
    url = get_settings().database_url
    safe_url = url.split("@")[-1] if "@" in url else url
    print(f"Connecting to: {safe_url}")
    try:
        with get_engine().connect() as conn:
            version = conn.execute(text("SHOW server_version")).scalar()
            db_name = conn.execute(text("SELECT current_database()")).scalar()
            print(f"  [OK] connected to database '{db_name}' (PostgreSQL {version})")
            conn.execute(text("SELECT 1"))
            print("  [OK] test query executed")
            tables = sorted(inspect(conn).get_table_names())
            print(f"  [OK] tables: {', '.join(tables) if tables else '(none; run: alembic upgrade head)'}")
            if "alembic_version" in tables:
                rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
                print(f"  [OK] migration revision: {rev}")
    except Exception as exc:  # noqa: BLE001
        print(f"  [FAIL] {type(exc).__name__}: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
