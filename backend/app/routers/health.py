from fastapi import APIRouter, Request

from app.config import settings
from app.models import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    return HealthResponse(
        status="ok",
        model_loaded=request.app.state.classifier is not None,
        stockfish_available=request.app.state.engine is not None,
        stockfish_path=settings.stockfish_path,
    )
