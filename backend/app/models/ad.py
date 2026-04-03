from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Ad(Base, TimestampMixin):
    __tablename__ = "ads"

    id: Mapped[int] = mapped_column(primary_key=True)
    platform: Mapped[str] = mapped_column(String(50), default="yandex_direct", index=True)
    yandex_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True, index=True)
    vk_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True, index=True)
    ad_group_id: Mapped[int] = mapped_column(ForeignKey("ad_groups.id", ondelete="CASCADE"))
    type: Mapped[str | None] = mapped_column(String(50))
    title: Mapped[str | None] = mapped_column(String(255))
    title2: Mapped[str | None] = mapped_column(String(255))
    text: Mapped[str | None] = mapped_column(Text)
    href: Mapped[str | None] = mapped_column(Text)
    display_url_path: Mapped[str | None] = mapped_column(String(255))
    sitelinks: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str | None] = mapped_column(String(50))
    moderation_status: Mapped[str | None] = mapped_column(String(50))
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    ad_group: Mapped["AdGroup"] = relationship(back_populates="ads")  # type: ignore[name-defined]  # noqa: F821
