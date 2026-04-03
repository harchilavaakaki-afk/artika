from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class WebmasterQuery(Base):
    __tablename__ = "webmaster_queries"
    __table_args__ = (
        UniqueConstraint("query_text", "date", "device_type", name="uq_webmaster_query_text_date_device"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), index=True)
    query_text: Mapped[str] = mapped_column(Text)
    date: Mapped[date] = mapped_column(Date, index=True)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    ctr: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=0)
    position: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    url: Mapped[str | None] = mapped_column(Text)
    device_type: Mapped[str] = mapped_column(String(20), default="ALL")
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
