from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class DailyStats(Base):
    __tablename__ = "daily_stats"
    __table_args__ = (
        UniqueConstraint("campaign_id", "date", name="uq_daily_stats_campaign_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    conversions: Mapped[int] = mapped_column(Integer, default=0)
    revenue: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    ctr: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=0)
    avg_cpc: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    avg_position: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    bounce_rate: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    campaign: Mapped["Campaign"] = relationship(back_populates="daily_stats")  # type: ignore[name-defined]  # noqa: F821
