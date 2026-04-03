from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class AbTest(Base, TimestampMixin):
    __tablename__ = "ab_tests"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"))
    variant_a_ids: Mapped[list] = mapped_column(JSONB)  # control group IDs
    variant_b_ids: Mapped[list] = mapped_column(JSONB)  # test group IDs
    goal_id: Mapped[int | None] = mapped_column(ForeignKey("goals.id", ondelete="SET NULL"))
    metric_type: Mapped[str] = mapped_column(String(50))  # CTR, CPA, CONVERSION_RATE, ROI
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="RUNNING")  # RUNNING, PAUSED, COMPLETED
    winner: Mapped[str | None] = mapped_column(String(10))  # A, B, INCONCLUSIVE
    results: Mapped[dict | None] = mapped_column(JSONB)
    ai_analysis_id: Mapped[int | None] = mapped_column(ForeignKey("ai_insights.id", ondelete="SET NULL"))
