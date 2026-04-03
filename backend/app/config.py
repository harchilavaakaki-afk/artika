from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database (SQLite by default, switch to PostgreSQL when Docker is available)
    database_url: str = "sqlite+aiosqlite:///./artika.db"

    # JWT
    jwt_secret: str = "change-me-to-a-random-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    # Yandex
    yandex_oauth_token: str = ""
    yandex_metrika_counter_id: int = 0
    yandex_webmaster_host_id: str = ""

    # VK Ads
    vk_ads_access_token: str = ""
    vk_ads_client_id: str = ""
    vk_ads_client_secret: str = ""
    vk_app_id: int = 0  # VK App ID for oauth.vk.com (integer, from vk.com/apps)
    vk_ads_cookie: str = ""  # Browser session cookies from ads.vk.com (Cookie header value)
    vk_ads_account_id: str = "4168629"  # myTarget account ID

    # Claude AI
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-20250514"

    # Sync
    sync_interval_minutes: int = 60

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    # Encryption
    fernet_key: str = ""


settings = Settings()
