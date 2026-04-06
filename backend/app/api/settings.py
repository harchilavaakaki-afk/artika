from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.db.session import get_db
from app.models.api_credential import ApiCredential
from app.models.user import User
from app.security.encryption import encrypt

router = APIRouter(prefix="/settings", tags=["Настройки"])


class CredentialRequest(BaseModel):
    service: str  # YANDEX_DIRECT, YANDEX_METRIKA, YANDEX_WEBMASTER
    oauth_token: str
    client_login: str | None = None
    counter_id: int | None = None
    host_id: str | None = None


class CredentialResponse(BaseModel):
    id: int
    service: str
    client_login: str | None
    counter_id: int | None
    host_id: str | None
    is_active: bool
    last_validated: str | None

    model_config = {"from_attributes": True}


@router.get("/credentials", response_model=list[CredentialResponse])
async def list_credentials(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(ApiCredential))
    creds = result.scalars().all()
    return [
        CredentialResponse(
            id=c.id,
            service=c.service,
            client_login=c.client_login,
            counter_id=c.counter_id,
            host_id=c.host_id,
            is_active=c.is_active,
            last_validated=c.last_validated.isoformat() if c.last_validated else None,
        )
        for c in creds
    ]


@router.post("/credentials", response_model=CredentialResponse)
async def save_credential(
    body: CredentialRequest,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    # Check if credential for this service already exists
    result = await db.execute(
        select(ApiCredential).where(ApiCredential.service == body.service)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.oauth_token = encrypt(body.oauth_token)
        existing.client_login = body.client_login
        existing.counter_id = body.counter_id
        existing.host_id = body.host_id
        await db.commit()
        await db.refresh(existing)
        cred = existing
    else:
        cred = ApiCredential(
            service=body.service,
            oauth_token=encrypt(body.oauth_token),
            client_login=body.client_login,
            counter_id=body.counter_id,
            host_id=body.host_id,
        )
        db.add(cred)
        await db.commit()
        await db.refresh(cred)

    return CredentialResponse(
        id=cred.id,
        service=cred.service,
        client_login=cred.client_login,
        counter_id=cred.counter_id,
        host_id=cred.host_id,
        is_active=cred.is_active,
        last_validated=cred.last_validated.isoformat() if cred.last_validated else None,
    )
