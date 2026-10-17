import json

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.models import AnalysisResponse, BestMove, Confidence, Evaluation
from app.services.board_detector import BoardDetectionError, detect_board
from app.services.fen_builder import build_fen

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_board(
    request: Request,
    image: UploadFile = File(...),
    turn: str = Form(...),
    corners: str | None = Form(None),
):
    if turn not in ("w", "b"):
        raise HTTPException(status_code=422, detail="turn must be 'w' or 'b'")

    image_bytes = await image.read()

    # Parse manual corners if provided
    manual_corners = None
    if corners:
        try:
            manual_corners = json.loads(corners)
        except json.JSONDecodeError:
            raise HTTPException(status_code=422, detail="Invalid corners JSON")

    # 1. Detect board and extract squares
    try:
        _, squares = detect_board(image_bytes, manual_corners)
    except BoardDetectionError as e:
        raise HTTPException(
            status_code=422,
            detail={"message": str(e), "error_code": "BOARD_NOT_FOUND"},
        )

    # 2. Classify each square
    classifier = request.app.state.classifier
    classifications = classifier.classify_squares(squares)

    # 3. Build FEN
    piece_fen, full_fen, board_grid, low_confidence = build_fen(
        classifications, turn
    )

    # 4. Compute confidence stats
    confs = [c for _, c in classifications]
    confidence = Confidence(
        min=round(min(confs), 4),
        avg=round(sum(confs) / len(confs), 4),
        low_confidence_squares=low_confidence,
    )

    # 5. Get best move from Stockfish
    engine = request.app.state.engine
    if engine is None:
        raise HTTPException(
            status_code=503,
            detail="Stockfish engine not available. Check CH_STOCKFISH_PATH.",
        )

    try:
        result = await engine.analyze(full_fen)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Stockfish analysis failed: {e}",
        )

    return AnalysisResponse(
        fen=piece_fen,
        full_fen=full_fen,
        board=board_grid,
        best_move=BestMove(**result["best_move"]),
        evaluation=Evaluation(**result["evaluation"]),
        confidence=confidence,
    )
