import { useState } from "react";
import { useNavigate } from "react-router-dom";

function extractUsername(input: string): string {
  const trimmed = input.trim().replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] ?? "";
  } catch {
    return trimmed.replace(/^@/, "");
  }
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const username = extractUsername(input);
    if (!username) {
      setError("Please enter an Instagram profile URL or username.");
      return;
    }
    navigate(`/results?profile=${encodeURIComponent(username)}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg flex flex-col items-center gap-10">

        {/* Branding */}
        <div className="flex flex-col items-center gap-4">
          <div className="ig-gradient w-16 h-16 rounded-sm flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Bot <span className="ig-gradient-text">Detector</span>
            </h1>
            <p className="text-zinc-400 text-sm text-center leading-relaxed">
              Paste a public Instagram profile URL to scan its followers
              <br />
              and identify potential bot accounts.
            </p>
          </div>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError("");
              }}
              placeholder="https://www.instagram.com/username"
              className="flex-1 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-zinc-500 transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="ig-gradient text-white font-semibold px-6 py-3 rounded-sm text-sm hover:opacity-90 active:opacity-80 transition-opacity whitespace-nowrap cursor-pointer"
            >
              Analyze
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <p className="text-zinc-700 text-xs text-center">
            Only public Instagram profiles can be scanned.
          </p>
        </form>

      </div>
    </div>
  );
}
