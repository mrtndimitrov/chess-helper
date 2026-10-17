import { useState, useCallback, useMemo } from "react";
import { analyzeBoard, type AnalysisResult } from "./api/client";
import ImageUpload from "./components/ImageUpload";
import TurnSelector from "./components/TurnSelector";
import AnalysisResultView from "./components/AnalysisResult";
import CornerPicker from "./components/CornerPicker";

type AppState = "upload" | "configure" | "loading" | "result" | "error";

export default function App() {
  const [state, setState] = useState<AppState>("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [showCornerPicker, setShowCornerPicker] = useState(false);

  const imageUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  const handleImageSelected = useCallback((file: File) => {
    setImageFile(file);
    setState("configure");
    setResult(null);
    setError("");
  }, []);

  const handleAnalyze = useCallback(
    async (corners?: number[][]) => {
      if (!imageFile) return;
      setState("loading");
      setError("");
      try {
        const res = await analyzeBoard(imageFile, turn, corners);
        setResult(res);
        setState("result");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(msg);
        setState("error");
      }
    },
    [imageFile, turn],
  );

  const handleReset = useCallback(() => {
    setImageFile(null);
    setResult(null);
    setError("");
    setState("upload");
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Chess Helper</h1>
          <p className="text-slate-400 mt-1">
            Upload a board screenshot and get the best move
          </p>
        </header>

        {/* Upload State */}
        {state === "upload" && (
          <div className="max-w-lg mx-auto">
            <ImageUpload onImageSelected={handleImageSelected} />
          </div>
        )}

        {/* Configure State */}
        {(state === "configure" || state === "loading") && imageUrl && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="rounded-xl overflow-hidden border border-slate-700">
              <img
                src={imageUrl}
                alt="Uploaded chess board"
                className="w-full"
              />
            </div>

            <TurnSelector turn={turn} onChange={setTurn} />

            <div className="flex gap-3">
              <button
                onClick={() => handleAnalyze()}
                disabled={state === "loading"}
                className="flex-1 py-3 px-6 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {state === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Position"
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={state === "loading"}
                className="py-3 px-4 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>

            <button
              onClick={() => setShowCornerPicker(true)}
              className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Board not detected? Select corners manually
            </button>
          </div>
        )}

        {/* Result State */}
        {state === "result" && result && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <AnalysisResultView result={result} />
            </div>
            <div className="text-center">
              <button
                onClick={handleReset}
                className="py-2 px-6 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Analyze Another Position
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === "error" && (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-red-900/30 border border-red-800 rounded-xl p-4">
              <p className="text-red-400">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setState("configure");
                  setError("");
                }}
                className="flex-1 py-2 px-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Try Again
              </button>
              {imageUrl && (
                <button
                  onClick={() => setShowCornerPicker(true)}
                  className="flex-1 py-2 px-4 rounded-xl bg-emerald-800 text-emerald-200 hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Select Corners Manually
                </button>
              )}
              <button
                onClick={handleReset}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Corner Picker Modal */}
        {showCornerPicker && imageUrl && (
          <CornerPicker
            imageUrl={imageUrl}
            onConfirm={(corners) => {
              setShowCornerPicker(false);
              handleAnalyze(corners);
            }}
            onCancel={() => setShowCornerPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
