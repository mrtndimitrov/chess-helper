export interface BestMove {
  uci: string;
  san: string;
  from_square: string;
  to_square: string;
}

export interface Evaluation {
  type: string;
  value: number;
}

export interface Confidence {
  min: number;
  avg: number;
  low_confidence_squares: string[];
}

export interface AnalysisResult {
  fen: string;
  full_fen: string;
  board: string[][];
  best_move: BestMove;
  evaluation: Evaluation;
  confidence: Confidence;
}

export interface AnalysisError {
  detail: string | { message: string; error_code: string };
}

export async function analyzeBoard(
  image: File,
  turn: "w" | "b",
  corners?: number[][],
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("turn", turn);
  if (corners) {
    formData.append("corners", JSON.stringify(corners));
  }

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err: AnalysisError = await response.json();
    const message =
      typeof err.detail === "string" ? err.detail : err.detail.message;
    throw new Error(message);
  }

  return response.json();
}
