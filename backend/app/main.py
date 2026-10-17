from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services.piece_classifier import PieceClassifier
from app.services.engine import ChessEngine
from app.routers import analysis, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model and Stockfish on startup
    app.state.classifier = PieceClassifier(settings.model_path)
    try:
        app.state.engine = ChessEngine(
            stockfish_path=settings.stockfish_path,
            depth=settings.stockfish_depth,
            threads=settings.stockfish_threads,
            hash_mb=settings.stockfish_hash_mb,
        )
    except Exception:
        app.state.engine = None
    yield


app = FastAPI(title="Chess Helper API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
