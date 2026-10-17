from pydantic import BaseModel


class BestMove(BaseModel):
    uci: str
    san: str
    from_square: str
    to_square: str


class Evaluation(BaseModel):
    type: str  # "cp" or "mate"
    value: int


class Confidence(BaseModel):
    min: float
    avg: float
    low_confidence_squares: list[str]


class AnalysisResponse(BaseModel):
    fen: str
    full_fen: str
    board: list[list[str]]
    best_move: BestMove
    evaluation: Evaluation
    confidence: Confidence


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    stockfish_available: bool
    stockfish_path: str
