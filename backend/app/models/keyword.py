from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Keyword(Base, TimestampMixin):
    __tablename__ = "keywords"

    id: Mapped[int] = mapped_column(primary_key=True)
    yandex_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False, index=True)
    ad_group_id: Mapped[int] = mapped_column(ForeignKey("ad_groups.id", ondelete="CASCADE"))
    keyword: Mapped[str] = mapped_column(Text)
    bid: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[str | None] = mapped_column(String(50))
    serving_status: Mapped[str | None] = mapped_column(String(50))
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    ad_group: Mapped["AdGroup"] = relationship(back_populates="keywords")  # type: ignore[name-defined]  # noqa: F821
