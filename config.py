import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DEFAULT_BUSINESS_CONTEXT = (
	"Sen EMOVIA'nin etik ve insan odakli psikolojik iyi olus asistanisin. "
	"Insanlarin duygularini fark etmesine, kendini daha iyi anlamasina ve gunluk iyi olusunu desteklemesine yardimci ol. "
	"Tani koyma, terapi yerine gecme; riskli durumlarda guvenilir bir uzmana veya yerel acil destek kaynaklarina yonlendir."
)


class Config:
	SECRET_KEY = os.environ.get("SECRET_KEY", "emovia-dev-secret")
	DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'emovia.db')}")
	GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
	AI_PROVIDER = os.environ.get("AI_PROVIDER", "groq")
	BUSINESS_CONTEXT = os.environ.get("BUSINESS_CONTEXT", DEFAULT_BUSINESS_CONTEXT)
	CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
	GROQ_API_BASE_URL = os.environ.get("GROQ_API_BASE_URL", "https://api.groq.com/openai/v1")
	GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")


class DevelopmentConfig(Config):
	DEBUG = True


class ProductionConfig(Config):
	DEBUG = False


config_by_name = {
	"development": DevelopmentConfig,
	"production": ProductionConfig,
}

# Backward-compatible aliases for modules or deployments using the old names.
DB_PATH = os.path.join(BASE_DIR, "emovia.db")
SECRET_KEY = Config.SECRET_KEY
BUSINESS_CONTEXT = Config.BUSINESS_CONTEXT
