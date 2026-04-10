from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.campaigns import router as campaigns_router, ad_groups_router, ads_router
from app.api.sync import router as sync_router
from app.api.analytics import router as analytics_router
from app.api.ai_insights import router as ai_insights_router
from app.api.metrika import router as metrika_router
from app.api.projects import router as projects_router
from app.api.settings import router as settings_router
from app.api.webmaster import router as webmaster_router
from app.api.vk_ads_api import router as vk_ads_router
from app.api.project_tasks import router as project_tasks_router
from app.api.calltouch import router as calltouch_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(campaigns_router)
api_router.include_router(ad_groups_router)
api_router.include_router(ads_router)
api_router.include_router(sync_router)
api_router.include_router(analytics_router)
api_router.include_router(ai_insights_router)
api_router.include_router(metrika_router)
api_router.include_router(projects_router)
api_router.include_router(settings_router)
api_router.include_router(webmaster_router)
api_router.include_router(vk_ads_router)
api_router.include_router(project_tasks_router)
api_router.include_router(calltouch_router)
