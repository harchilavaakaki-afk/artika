from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.middleware import get_current_user
from app.db.session import get_db
from app.models.project_task import ProjectTask
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Задачи проектов"])


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    status: str = "not_started"
    category: str | None = None
    details: list[str] | None = None
    sort_order: int = 0


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    category: str | None = None
    details: list[str] | None = None
    sort_order: int | None = None


class TaskResponse(BaseModel):
    id: int
    project_id: int | None
    title: str
    description: str | None
    status: str
    category: str | None
    details: list[str] | None
    sort_order: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class TaskSummary(BaseModel):
    total: int
    done: int
    partial: int
    not_started: int
    bug: int
    percent: int


@router.get("/{project_id}/tasks", response_model=list[TaskResponse])
async def list_tasks(
    project_id: int,
    category: str | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    q = select(ProjectTask).where(ProjectTask.project_id == project_id)
    if category:
        q = q.where(ProjectTask.category == category)
    if status:
        q = q.where(ProjectTask.status == status)
    q = q.order_by(ProjectTask.sort_order, ProjectTask.id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{project_id}/tasks/summary", response_model=TaskSummary)
async def task_summary(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    q = select(ProjectTask.status, func.count()).where(
        ProjectTask.project_id == project_id
    ).group_by(ProjectTask.status)
    result = await db.execute(q)
    counts = dict(result.all())
    total = sum(counts.values())
    done = counts.get("done", 0)
    return TaskSummary(
        total=total,
        done=done,
        partial=counts.get("partial", 0),
        not_started=counts.get("not_started", 0),
        bug=counts.get("bug", 0),
        percent=round(done / total * 100) if total else 0,
    )


@router.post("/{project_id}/tasks", response_model=TaskResponse)
async def create_task(
    project_id: int,
    body: TaskCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    task = ProjectTask(project_id=project_id, **body.model_dump())
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


@router.put("/{project_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    project_id: int,
    task_id: int,
    body: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ProjectTask).where(ProjectTask.id == task_id, ProjectTask.project_id == project_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.flush()
    await db.refresh(task)
    return task


@router.delete("/{project_id}/tasks/{task_id}")
async def delete_task(
    project_id: int,
    task_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ProjectTask).where(ProjectTask.id == task_id, ProjectTask.project_id == project_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    await db.delete(task)
    await db.flush()
    return {"status": "ok"}
