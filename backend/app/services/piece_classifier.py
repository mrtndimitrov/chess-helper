import sys
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn.functional as F

# Add models dir to path so we can import ChessPieceCNN
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "models"))
from chess_piece_cnn import ChessPieceCNN

CLASS_NAMES = [
    "black_bishop",
    "black_king",
    "black_knight",
    "black_pawn",
    "black_queen",
    "black_rook",
    "empty",
    "white_bishop",
    "white_king",
    "white_knight",
    "white_pawn",
    "white_queen",
    "white_rook",
]


class PieceClassifier:
    def __init__(self, model_path: str):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = ChessPieceCNN(num_classes=len(CLASS_NAMES))
        self.model.load_state_dict(
            torch.load(model_path, map_location=self.device, weights_only=True)
        )
        self.model.to(self.device)
        self.model.eval()

    def classify_squares(
        self, squares: list[np.ndarray]
    ) -> list[tuple[str, float]]:
        """Classify a list of 80x80 square images.

        Returns list of (class_name, confidence) tuples.
        """
        batch = np.stack([self._preprocess(sq) for sq in squares])
        tensor = torch.from_numpy(batch).float().to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = F.softmax(logits, dim=1)

        indices = torch.argmax(probs, dim=1).cpu().numpy()
        confidences = probs[torch.arange(len(indices)), indices].cpu().numpy()
        return [(CLASS_NAMES[i], float(c)) for i, c in zip(indices, confidences)]

    def _preprocess(self, square: np.ndarray) -> np.ndarray:
        """Convert a square image to model input format: (1, 80, 80) normalized."""
        if len(square.shape) == 3:
            gray = cv2.cvtColor(square, cv2.COLOR_BGR2GRAY)
        else:
            gray = square
        resized = cv2.resize(gray, (80, 80))
        normalized = (resized.astype(np.float32) / 255.0 - 0.5) / 0.5
        return normalized[np.newaxis, :]  # (1, 80, 80) channel-first
