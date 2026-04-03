from sqlalchemy import BigInteger, Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    domain: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)

    # Yandex Metrika
    metrika_counter_id: Mapped[int | None] = mapped_column(BigInteger)

    # Yandex Webmaster
    webmaster_host_id: Mapped[str | None] = mapped_column(String(255))

    # Yandex Direct
    direct_client_login: Mapped[str | None] = mapped_column(String(255))

    # VK Ads (myTarget)
    vk_account_id: Mapped[int | None] = mapped_column(BigInteger)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    campaigns: Mapped[list["Campaign"]] = relationship(back_populates="project")  # type: ignore[name-defined]  # noqa: F821
