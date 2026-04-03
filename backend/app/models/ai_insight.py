from sqlalchemy import ForeignKey, String, Text
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class AiInsight(Base, TimestampMixin):
    __tablename__ = "ai_insights"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int | None] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    insight_type: Mapped[str] = mapped_column(String(50), index=True)  # PERFORMANCE, KEYWORDS, QUERIES, AD_VARIANTS, OPTIMIZATION, AB_TEST
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    recommendations: Mapped[dict | None] = mapped_column(JSONB)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)
    status: Mapped[str] = mapped_column(String(20), default="NEW")  # NEW, VIEWED, APPLIED, DISMISSED
