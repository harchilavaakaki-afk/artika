from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Conversion(Base):
    __tablename__ = "conversions"
    __table_args__ = (
        UniqueConstraint("campaign_id", "goal_id", "date", name="uq_conversion_campaign_goal_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date)
    conversions_count: Mapped[int] = mapped_column(Integer, default=0)
    conversion_rate: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=0)
    cost_per_conversion: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
