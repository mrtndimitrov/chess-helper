interface Props {
  turn: "w" | "b";
  onChange: (turn: "w" | "b") => void;
}

export default function TurnSelector({ turn, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange("w")}
        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
          turn === "w"
            ? "bg-white text-slate-900"
            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
        }`}
      >
        White to move
      </button>
      <button
        onClick={() => onChange("b")}
        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
          turn === "b"
            ? "bg-slate-900 text-white ring-2 ring-slate-400"
            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
        }`}
      >
        Black to move
      </button>
    </div>
  );
}
