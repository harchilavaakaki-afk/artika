from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    platform: Mapped[str] = mapped_column(String(50), default="yandex_direct", index=True)  # yandex_direct, vk_ads
    yandex_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True, index=True)
    vk_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[str | None] = mapped_column(String(50))
    state: Mapped[str | None] = mapped_column(String(50))
    daily_budget: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    strategy_type: Mapped[str | None] = mapped_column(String(100))
    strategy_params: Mapped[dict | None] = mapped_column(JSONB)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), index=True)

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="campaigns")  # type: ignore[name-defined]  # noqa: F821
    ad_groups: Mapped[list["AdGroup"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    daily_stats: Mapped[list["DailyStats"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
