from pathlib import Path

from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    stockfish_path: str = "stockfish"
    model_path: str = str(BACKEND_DIR / "models" / "ChessPieceCNN-15-epochs.pt")
    stockfish_depth: int = 18
    stockfish_threads: int = 2
    stockfish_hash_mb: int = 128
    max_image_size_mb: int = 10

    model_config = {"env_prefix": "CH_", "env_file": ".env"}


settings = Settings()
