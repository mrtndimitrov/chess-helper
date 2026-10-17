import asyncio

import chess
from stockfish import Stockfish


class ChessEngine:
    def __init__(
        self,
        stockfish_path: str,
        depth: int = 18,
        threads: int = 2,
        hash_mb: int = 128,
    ):
        self._sf = Stockfish(
            path=stockfish_path,
            depth=depth,
            parameters={"Threads": threads, "Hash": hash_mb},
        )
        self._lock = asyncio.Lock()

    async def analyze(self, fen: str) -> dict:
        """Analyze a FEN position and return best move + evaluation."""
        async with self._lock:
            return await asyncio.to_thread(self._analyze_sync, fen)

    def _analyze_sync(self, fen: str) -> dict:
        self._sf.set_fen_position(fen)
        best_move_uci = self._sf.get_best_move()
        evaluation = self._sf.get_evaluation()

        # Convert UCI to SAN using python-chess
        board = chess.Board(fen)
        move = chess.Move.from_uci(best_move_uci)
        san = board.san(move)

        return {
            "best_move": {
                "uci": best_move_uci,
                "san": san,
                "from_square": best_move_uci[:2],
                "to_square": best_move_uci[2:4],
            },
            "evaluation": {
                "type": evaluation["type"],
                "value": evaluation["value"],
            },
        }
