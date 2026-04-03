from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class AdGroup(Base, TimestampMixin):
    __tablename__ = "ad_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    platform: Mapped[str] = mapped_column(String(50), default="yandex_direct", index=True)
    yandex_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True, index=True)
    vk_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True, index=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str | None] = mapped_column(String(50))
    region_ids: Mapped[list | None] = mapped_column(JSONB)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    campaign: Mapped["Campaign"] = relationship(back_populates="ad_groups")  # type: ignore[name-defined]  # noqa: F821
    ads: Mapped[list["Ad"]] = relationship(back_populates="ad_group", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    keywords: Mapped[list["Keyword"]] = relationship(back_populates="ad_group", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
