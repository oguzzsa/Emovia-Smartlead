import sqlite3
from contextlib import closing

from config import Config


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isim TEXT NOT NULL,
    telefon TEXT NOT NULL,
    mesaj TEXT,
    tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def _database_path(app=None):
    database_url = (app.config.get("DATABASE_URL") if app else Config.DATABASE_URL) or "sqlite:///emovia.db"
    if database_url.startswith("sqlite:///"):
        path = database_url[10:]
        return path if path else "emovia.db"
    return database_url


def init_db(app=None):
    """Create the leads table and migrate the earlier EMOVIA schema if needed."""
    with sqlite3.connect(_database_path(app)) as conn:
        conn.execute(CREATE_TABLE_SQL)
        conn.commit()

        current_columns = {row[1] for row in conn.execute("PRAGMA table_info(leads)").fetchall()}
        if "isim" not in current_columns:
            conn.execute("ALTER TABLE leads ADD COLUMN isim TEXT")
        if "telefon" not in current_columns:
            conn.execute("ALTER TABLE leads ADD COLUMN telefon TEXT")
        if "mesaj" not in current_columns:
            conn.execute("ALTER TABLE leads ADD COLUMN mesaj TEXT")
        if "tarih" not in current_columns:
            conn.execute("ALTER TABLE leads ADD COLUMN tarih TIMESTAMP")

        if "name" in current_columns:
            conn.execute("UPDATE leads SET isim = COALESCE(isim, name) WHERE isim IS NULL")
        if "phone" in current_columns:
            conn.execute("UPDATE leads SET telefon = COALESCE(telefon, phone) WHERE telefon IS NULL")
        if "message" in current_columns:
            conn.execute("UPDATE leads SET mesaj = COALESCE(mesaj, message) WHERE mesaj IS NULL")
        if "created_at" in current_columns:
            conn.execute("UPDATE leads SET tarih = COALESCE(tarih, created_at) WHERE tarih IS NULL")

        conn.commit()


def get_db(app=None):
    conn = sqlite3.connect(_database_path(app))
    conn.row_factory = sqlite3.Row
    return conn


def lead_ekle(isim, telefon, mesaj):
    try:
        with closing(get_db()) as conn:
            columns = {row[1] for row in conn.execute("PRAGMA table_info(leads)").fetchall()}
            if "name" in columns:
                cursor = conn.execute(
                    "INSERT INTO leads (name, email, phone, message, isim, telefon, mesaj, tarih) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                    (isim, "", telefon, mesaj, isim, telefon, mesaj),
                )
            else:
                cursor = conn.execute(
                    "INSERT INTO leads (isim, telefon, mesaj) VALUES (?, ?, ?)",
                    (isim, telefon, mesaj),
                )
            conn.commit()
            return cursor.lastrowid
    except sqlite3.Error as exc:
        raise RuntimeError(f"Database error: {exc}") from exc


def tum_leadler():
    try:
        with closing(get_db()) as conn:
            rows = conn.execute("SELECT id, isim, telefon, mesaj, tarih FROM leads ORDER BY tarih DESC, id DESC").fetchall()
            return [dict(row) for row in rows]
    except sqlite3.Error as exc:
        raise RuntimeError(f"Database error: {exc}") from exc


# Compatibility aliases for existing integrations.
get_db_connection = get_db
add_lead = lead_ekle
get_all_leads = tum_leadler
