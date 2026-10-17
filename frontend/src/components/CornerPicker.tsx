import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  imageUrl: string;
  onConfirm: (corners: number[][]) => void;
  onCancel: () => void;
}

const CORNER_LABELS = ["Top-Left", "Top-Right", "Bottom-Right", "Bottom-Left"];

export default function CornerPicker({ imageUrl, onConfirm, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [corners, setCorners] = useState<number[][]>([]);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(
    null,
  );

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (corners.length >= 4 || !imgRef.current || !imageSize) return;

      const rect = imgRef.current.getBoundingClientRect();
      const scaleX = imageSize.w / rect.width;
      const scaleY = imageSize.h / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      setCorners((prev) => [...prev, [Math.round(x), Math.round(y)]]);
    },
    [corners.length, imageSize],
  );

  const displayCorners = corners.map((c) => {
    if (!imgRef.current || !imageSize) return [0, 0];
    const rect = imgRef.current.getBoundingClientRect();
    return [c[0] / (imageSize.w / rect.width), c[1] / (imageSize.h / rect.height)];
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
        <h3 className="text-lg font-medium text-slate-200 mb-2">
          Select Board Corners
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Click the 4 corners of the chessboard in order:{" "}
          <span className="text-emerald-400 font-medium">
            {corners.length < 4 ? CORNER_LABELS[corners.length] : "Done!"}
          </span>
        </p>

        <div ref={containerRef} className="relative inline-block cursor-crosshair" onClick={handleClick}>
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Chess board"
            className="max-w-full max-h-[60vh]"
            draggable={false}
          />
          {/* Draw corner points */}
          {displayCorners.map((pos, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center"
              style={{ left: pos[0], top: pos[1] }}
            >
              <span className="text-[8px] font-bold text-white">
                {i + 1}
              </span>
            </div>
          ))}
          {/* Draw lines between corners */}
          {corners.length >= 2 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {displayCorners.map((pos, i) => {
                if (i === 0) return null;
                const prev = displayCorners[i - 1];
                return (
                  <line
                    key={i}
                    x1={prev[0]}
                    y1={prev[1]}
                    x2={pos[0]}
                    y2={pos[1]}
                    stroke="rgba(52,211,153,0.8)"
                    strokeWidth="2"
                  />
                );
              })}
              {corners.length === 4 && (
                <line
                  x1={displayCorners[3][0]}
                  y1={displayCorners[3][1]}
                  x2={displayCorners[0][0]}
                  y2={displayCorners[0][1]}
                  stroke="rgba(52,211,153,0.8)"
                  strokeWidth="2"
                />
              )}
            </svg>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setCorners([])}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => corners.length === 4 && onConfirm(corners)}
            disabled={corners.length !== 4}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Use These Corners
          </button>
        </div>
      </div>
    </div>
  );
}
