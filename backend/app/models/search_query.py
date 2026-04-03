from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SearchQuery(Base):
    __tablename__ = "search_queries"
    __table_args__ = (
        UniqueConstraint("campaign_id", "query_text", "date", name="uq_search_query_campaign_text_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    keyword_id: Mapped[int | None] = mapped_column(ForeignKey("keywords.id", ondelete="SET NULL"))
    query_text: Mapped[str] = mapped_column(Text)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    date: Mapped[date] = mapped_column(Date, index=True)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
