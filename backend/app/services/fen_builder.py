PIECE_TO_FEN = {
    "white_king": "K",
    "white_queen": "Q",
    "white_rook": "R",
    "white_bishop": "B",
    "white_knight": "N",
    "white_pawn": "P",
    "black_king": "k",
    "black_queen": "q",
    "black_rook": "r",
    "black_bishop": "b",
    "black_knight": "n",
    "black_pawn": "p",
    "empty": "",
}

# Starting positions for castling inference
_WHITE_KING_START = (7, 4)   # rank 1, file e (row 7 in 0-indexed top-down)
_WHITE_ROOK_K_START = (7, 7) # rank 1, file h
_WHITE_ROOK_Q_START = (7, 0) # rank 1, file a
_BLACK_KING_START = (0, 4)   # rank 8, file e
_BLACK_ROOK_K_START = (0, 7) # rank 8, file h
_BLACK_ROOK_Q_START = (0, 0) # rank 8, file a


def _compress_row(rank: str) -> str:
    """Compress consecutive empty squares: '111' -> '3'."""
    result = ""
    count = 0
    for ch in rank:
        if ch == "1":
            count += 1
        else:
            if count > 0:
                result += str(count)
                count = 0
            result += ch
    if count > 0:
        result += str(count)
    return result


def _square_name(row: int, col: int) -> str:
    """Convert row/col (0-indexed, top-left = a8) to algebraic notation."""
    file = chr(ord("a") + col)
    rank = str(8 - row)
    return f"{file}{rank}"


def _infer_castling(grid: list[list[str]]) -> str:
    """Infer castling availability from king/rook positions."""
    rights = ""
    if grid[_WHITE_KING_START[0]][_WHITE_KING_START[1]] == "K":
        if grid[_WHITE_ROOK_K_START[0]][_WHITE_ROOK_K_START[1]] == "R":
            rights += "K"
        if grid[_WHITE_ROOK_Q_START[0]][_WHITE_ROOK_Q_START[1]] == "R":
            rights += "Q"
    if grid[_BLACK_KING_START[0]][_BLACK_KING_START[1]] == "k":
        if grid[_BLACK_ROOK_K_START[0]][_BLACK_ROOK_K_START[1]] == "r":
            rights += "k"
        if grid[_BLACK_ROOK_Q_START[0]][_BLACK_ROOK_Q_START[1]] == "r":
            rights += "q"
    return rights or "-"


def build_fen(
    classifications: list[tuple[str, float]],
    turn: str = "w",
) -> tuple[str, str, list[list[str]], list[str]]:
    """Build FEN from 64 square classifications.

    Args:
        classifications: List of 64 (class_name, confidence) tuples, row-major (a8..h1).
        turn: "w" or "b".

    Returns:
        Tuple of (piece_placement_fen, full_fen, board_grid, low_confidence_squares).
    """
    board_grid: list[list[str]] = []
    fen_rows: list[str] = []
    low_confidence: list[str] = []

    for row in range(8):
        rank_fen = ""
        rank_pieces: list[str] = []
        for col in range(8):
            idx = row * 8 + col
            class_name, conf = classifications[idx]
            fen_char = PIECE_TO_FEN[class_name]
            rank_pieces.append(fen_char)

            if conf < 0.8:
                low_confidence.append(_square_name(row, col))

            rank_fen += fen_char if fen_char else "1"

        board_grid.append(rank_pieces)
        fen_rows.append(_compress_row(rank_fen))

    piece_fen = "/".join(fen_rows)
    castling = _infer_castling(board_grid)
    full_fen = f"{piece_fen} {turn} {castling} - 0 1"

    return piece_fen, full_fen, board_grid, low_confidence
