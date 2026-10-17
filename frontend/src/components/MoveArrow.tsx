interface Props {
  from: string;
  to: string;
  boardSize: number;
}

function squareCenter(sq: string): [number, number] {
  const col = sq.charCodeAt(0) - "a".charCodeAt(0);
  const row = 8 - parseInt(sq[1]);
  // Return percentage-based coordinates
  return [(col + 0.5) / 8, (row + 0.5) / 8];
}

export default function MoveArrow({ from, to }: Props) {
  const [x1, y1] = squareCenter(from);
  const [x2, y2] = squareCenter(to);

  // Shorten the arrow slightly so it doesn't cover piece centers
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const shrink = 0.03;
  const sx1 = x1 + (dx / len) * shrink;
  const sy1 = y1 + (dy / len) * shrink;
  const sx2 = x2 - (dx / len) * shrink;
  const sy2 = y2 - (dy / len) * shrink;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="3"
          markerHeight="3"
          refX="2"
          refY="1.5"
          orient="auto"
        >
          <polygon points="0 0, 3 1.5, 0 3" fill="rgba(34,197,94,0.85)" />
        </marker>
      </defs>
      <line
        x1={sx1}
        y1={sy1}
        x2={sx2}
        y2={sy2}
        stroke="rgba(34,197,94,0.85)"
        strokeWidth="0.025"
        markerEnd="url(#arrowhead)"
      />
    </svg>
  );
}
