from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ApiCredential(Base, TimestampMixin):
    __tablename__ = "api_credentials"

    id: Mapped[int] = mapped_column(primary_key=True)
    service: Mapped[str] = mapped_column(String(50))  # YANDEX_DIRECT, YANDEX_METRIKA, YANDEX_WEBMASTER
    oauth_token: Mapped[str] = mapped_column(Text)  # Fernet-encrypted
    client_login: Mapped[str | None] = mapped_column(String(255))
    counter_id: Mapped[int | None] = mapped_column(BigInteger)
    host_id: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_validated: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
