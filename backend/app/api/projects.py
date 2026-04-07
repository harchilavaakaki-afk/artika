from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.db.session import get_db
from app.models.project import Project
from app.models.campaign import Campaign
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Проекты"])


class ProjectCreate(BaseModel):
    name: str
    domain: str | None = None
    description: str | None = None
    metrika_counter_id: int | None = None
    webmaster_host_id: str | None = None
    direct_client_login: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    domain: str | None
    description: str | None
    metrika_counter_id: int | None
    webmaster_host_id: str | None
    direct_client_login: str | None
    vk_account_id: int | None
    is_active: bool

    model_config = {"from_attributes": True}


class ProjectUpdate(BaseModel):
    name: str | None = None
    domain: str | None = None
    description: str | None = None
    metrika_counter_id: int | None = None
    webmaster_host_id: str | None = None
    direct_client_login: str | None = None
    vk_account_id: int | None = None
    is_active: bool | None = None


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).order_by(Project.name))
    return result.scalars().all()


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project


@router.post("", response_model=ProjectResponse)
async def create_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    project = Project(**body.model_dump())
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.flush()
    await db.refresh(project)
    return project


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    await db.delete(project)
    await db.commit()
    return {"status": "ok"}


@router.post("/{project_id}/assign-campaigns")
async def assign_campaigns_to_project(
    project_id: int,
    campaign_ids: list[int],
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Assign campaigns to a project."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Проект не найден")

    campaigns = (await db.execute(
        select(Campaign).where(Campaign.id.in_(campaign_ids))
    )).scalars().all()

    for c in campaigns:
        c.project_id = project_id

    await db.flush()
    return {"status": "ok", "assigned": len(campaigns)}
