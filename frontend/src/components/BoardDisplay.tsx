import MoveArrow from "./MoveArrow";

const PIECE_UNICODE: Record<string, string> = {
  K: "\u2654",
  Q: "\u2655",
  R: "\u2656",
  B: "\u2657",
  N: "\u2658",
  P: "\u2659",
  k: "\u265A",
  q: "\u265B",
  r: "\u265C",
  b: "\u265D",
  n: "\u265E",
  p: "\u265F",
};

interface Props {
  board: string[][];
  bestMoveFrom?: string;
  bestMoveTo?: string;
  lowConfidenceSquares?: string[];
}

function squareToCoords(sq: string): [number, number] {
  const col = sq.charCodeAt(0) - "a".charCodeAt(0);
  const row = 8 - parseInt(sq[1]);
  return [row, col];
}

function squareName(row: number, col: number): string {
  return `${String.fromCharCode("a".charCodeAt(0) + col)}${8 - row}`;
}

export default function BoardDisplay({
  board,
  bestMoveFrom,
  bestMoveTo,
  lowConfidenceSquares = [],
}: Props) {
  const lowConfSet = new Set(lowConfidenceSquares);

  return (
    <div className="relative inline-block">
      <div className="grid grid-cols-8 border-2 border-slate-600 rounded overflow-hidden">
        {board.map((row, r) =>
          row.map((piece, c) => {
            const isLight = (r + c) % 2 === 0;
            const sq = squareName(r, c);
            const isLowConf = lowConfSet.has(sq);
            const isFrom =
              bestMoveFrom &&
              squareToCoords(bestMoveFrom)[0] === r &&
              squareToCoords(bestMoveFrom)[1] === c;
            const isTo =
              bestMoveTo &&
              squareToCoords(bestMoveTo)[0] === r &&
              squareToCoords(bestMoveTo)[1] === c;

            return (
              <div
                key={`${r}-${c}`}
                className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl relative select-none ${
                  isLight ? "bg-amber-100" : "bg-amber-800"
                } ${isLowConf ? "ring-2 ring-inset ring-red-500" : ""} ${
                  isFrom ? "bg-yellow-300/60" : ""
                } ${isTo ? "bg-yellow-300/60" : ""}`}
                title={sq}
              >
                {piece && PIECE_UNICODE[piece] ? (
                  <span className={isLight ? "text-slate-800" : "text-slate-100"}>
                    {PIECE_UNICODE[piece]}
                  </span>
                ) : null}
                {c === 0 && (
                  <span
                    className={`absolute top-0.5 left-0.5 text-[10px] font-medium ${
                      isLight ? "text-amber-800/50" : "text-amber-100/50"
                    }`}
                  >
                    {8 - r}
                  </span>
                )}
                {r === 7 && (
                  <span
                    className={`absolute bottom-0 right-0.5 text-[10px] font-medium ${
                      isLight ? "text-amber-800/50" : "text-amber-100/50"
                    }`}
                  >
                    {String.fromCharCode("a".charCodeAt(0) + c)}
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>
      {bestMoveFrom && bestMoveTo && (
        <MoveArrow from={bestMoveFrom} to={bestMoveTo} boardSize={8} />
      )}
    </div>
  );
}
