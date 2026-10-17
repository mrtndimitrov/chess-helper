import type { AnalysisResult as AnalysisResultType } from "../api/client";
import BoardDisplay from "./BoardDisplay";

interface Props {
  result: AnalysisResultType;
}

function formatEval(evaluation: { type: string; value: number }): string {
  if (evaluation.type === "mate") {
    return `M${evaluation.value}`;
  }
  const pawns = evaluation.value / 100;
  return pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
}

function evalColor(evaluation: { type: string; value: number }): string {
  if (evaluation.type === "mate") {
    return evaluation.value > 0 ? "text-emerald-400" : "text-red-400";
  }
  if (evaluation.value > 50) return "text-emerald-400";
  if (evaluation.value < -50) return "text-red-400";
  return "text-slate-300";
}

export default function AnalysisResult({ result }: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Board */}
      <div>
        <BoardDisplay
          board={result.board}
          bestMoveFrom={result.best_move.from_square}
          bestMoveTo={result.best_move.to_square}
          lowConfidenceSquares={result.confidence.low_confidence_squares}
        />
      </div>

      {/* Info Panel */}
      <div className="flex flex-col gap-4 text-left min-w-64">
        {/* Best Move */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            Best Move
          </h3>
          <p className="text-3xl font-bold text-emerald-400">
            {result.best_move.san}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {result.best_move.from_square} → {result.best_move.to_square}
          </p>
        </div>

        {/* Evaluation */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            Evaluation
          </h3>
          <p className={`text-2xl font-bold ${evalColor(result.evaluation)}`}>
            {formatEval(result.evaluation)}
          </p>
        </div>

        {/* FEN */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            FEN
          </h3>
          <p
            className="text-sm text-slate-300 font-mono break-all cursor-pointer hover:text-white transition-colors"
            title="Click to copy"
            onClick={() => navigator.clipboard.writeText(result.full_fen)}
          >
            {result.full_fen}
          </p>
          <p className="text-xs text-slate-600 mt-1">Click to copy</p>
        </div>

        {/* Confidence */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            Confidence
          </h3>
          <div className="flex gap-4">
            <div>
              <p className="text-lg font-bold text-slate-300">
                {(result.confidence.avg * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500">Average</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-300">
                {(result.confidence.min * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500">Minimum</p>
            </div>
          </div>
          {result.confidence.low_confidence_squares.length > 0 && (
            <p className="text-xs text-red-400 mt-2">
              Low confidence:{" "}
              {result.confidence.low_confidence_squares.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
