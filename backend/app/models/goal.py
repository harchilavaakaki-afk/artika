from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Goal(Base, TimestampMixin):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    metrika_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[str | None] = mapped_column(String(50))
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    counter_id: Mapped[int] = mapped_column(BigInteger)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
