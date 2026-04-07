import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

type RiskLevel = "high" | "medium" | "low" | "real";
type FilterType = "all" | RiskLevel;

interface Follower {
  id: string;
  username: string;
  displayName: string;
  botScore: number;
  isKnownBot: boolean;
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "high";
  if (score >= 40) return "medium";
  if (score >= 10) return "low";
  return "real";
}

const MOCK_FOLLOWERS: Follower[] = [
  {
    id: "1",
    username: "xX_follow4follow_Xx",
    displayName: "Follow4Follow",
    botScore: 97,
    isKnownBot: true,
  },
  {
    id: "2",
    username: "free.insta.likes99",
    displayName: "Free Likes ✨",
    botScore: 94,
    isKnownBot: true,
  },
  {
    id: "3",
    username: "buy_ig_followers1",
    displayName: "IG Growth",
    botScore: 91,
    isKnownBot: false,
  },
  {
    id: "4",
    username: "promo_boost_22",
    displayName: "Promo Boost",
    botScore: 88,
    isKnownBot: true,
  },
  {
    id: "5",
    username: "spam_acc_4421",
    displayName: "",
    botScore: 85,
    isKnownBot: false,
  },
  {
    id: "6",
    username: "auto_liker_bot",
    displayName: "Auto Liker",
    botScore: 82,
    isKnownBot: true,
  },
  {
    id: "7",
    username: "brand_deals_offer",
    displayName: "Brand Deals 💰",
    botScore: 79,
    isKnownBot: false,
  },
  {
    id: "8",
    username: "ghost_user_2291",
    displayName: "",
    botScore: 76,
    isKnownBot: false,
  },
  {
    id: "9",
    username: "influx_media_co",
    displayName: "Influx Media",
    botScore: 68,
    isKnownBot: false,
  },
  {
    id: "10",
    username: "social_bxst",
    displayName: "Social Boost",
    botScore: 63,
    isKnownBot: true,
  },
  {
    id: "11",
    username: "trendy.clips.daily",
    displayName: "Trendy Clips",
    botScore: 57,
    isKnownBot: false,
  },
  {
    id: "12",
    username: "viralpage_hq",
    displayName: "Viral Page HQ",
    botScore: 51,
    isKnownBot: false,
  },
  {
    id: "13",
    username: "mia.thompson92",
    displayName: "Mia Thompson",
    botScore: 44,
    isKnownBot: false,
  },
  {
    id: "14",
    username: "new_user_39182",
    displayName: "",
    botScore: 38,
    isKnownBot: false,
  },
  {
    id: "15",
    username: "photography_hub",
    displayName: "Photography Hub",
    botScore: 29,
    isKnownBot: false,
  },
  {
    id: "16",
    username: "carlos_dev",
    displayName: "Carlos Dev",
    botScore: 21,
    isKnownBot: false,
  },
  {
    id: "17",
    username: "linaaa.k",
    displayName: "Lina K.",
    botScore: 14,
    isKnownBot: false,
  },
  {
    id: "18",
    username: "james.b.photo",
    displayName: "James B.",
    botScore: 6,
    isKnownBot: false,
  },
  {
    id: "19",
    username: "sara_designs",
    displayName: "Sara Designs",
    botScore: 4,
    isKnownBot: false,
  },
  {
    id: "20",
    username: "ofek_real",
    displayName: "Ofek",
    botScore: 1,
    isKnownBot: false,
  },
];

const FILTER_LABELS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High Risk" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low Risk" },
  { key: "real", label: "Real" },
];

const RISK_STYLES: Record<
  RiskLevel,
  { row: string; border: string; badge: string; score: string }
> = {
  high: {
    row: "bg-red-950/20",
    border: "border-l-red-500",
    badge: "bg-red-900/60 text-red-300",
    score: "text-red-400",
  },
  medium: {
    row: "bg-yellow-950/20",
    border: "border-l-yellow-500",
    badge: "bg-yellow-900/60 text-yellow-300",
    score: "text-yellow-400",
  },
  low: {
    row: "bg-green-950/20",
    border: "border-l-green-500",
    badge: "bg-green-900/60 text-green-300",
    score: "text-green-400",
  },
  real: {
    row: "bg-zinc-900/10",
    border: "border-l-zinc-700",
    badge: "bg-zinc-800 text-zinc-400",
    score: "text-zinc-500",
  },
};

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profile = searchParams.get("profile") ?? "";

  const [filter, setFilter] = useState<FilterType>("all");

  const sorted = [...MOCK_FOLLOWERS].sort((a, b) => b.botScore - a.botScore);

  const filtered =
    filter === "all"
      ? sorted
      : sorted.filter((f) => getRiskLevel(f.botScore) === filter);

  const counts = {
    all: sorted.length,
    high: sorted.filter((f) => getRiskLevel(f.botScore) === "high").length,
    medium: sorted.filter((f) => getRiskLevel(f.botScore) === "medium").length,
    low: sorted.filter((f) => getRiskLevel(f.botScore) === "low").length,
    real: sorted.filter((f) => getRiskLevel(f.botScore) === "real").length,
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => navigate("/")}
            className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors self-start mb-2 cursor-pointer"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Followers of <span className="ig-gradient-text">@{profile}</span>
          </h1>
          <p className="text-zinc-500 text-xs">
            {counts.all} accounts scanned &mdash;{" "}
            <span className="text-red-400">{counts.high} high risk</span>
            {", "}
            <span className="text-yellow-400">{counts.medium} medium</span>
            {", "}
            <span className="text-green-400">{counts.low} low risk</span>
            {", "}
            <span className="text-zinc-500">{counts.real} real</span>
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer border ${
                filter === key
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
              <span
                className={`ml-1.5 ${filter === key ? "text-zinc-500" : "text-zinc-600"}`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Account List */}
        <div className="flex flex-col gap-1.5">
          {filtered.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-10">
              No accounts in this category.
            </p>
          ) : (
            filtered.map((follower) => {
              const risk = getRiskLevel(follower.botScore);
              const styles = RISK_STYLES[risk];
              return (
                <div
                  key={follower.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-sm border-l-4 ${styles.row} ${styles.border}`}
                >
                  {/* Left — identity */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium truncate">
                        @{follower.username}
                      </span>
                      {follower.isKnownBot && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-red-900/60 text-red-300 shrink-0">
                          Known Bot
                        </span>
                      )}
                    </div>
                    {follower.displayName ? (
                      <span className="text-zinc-500 text-xs truncate">
                        {follower.displayName}
                      </span>
                    ) : null}
                  </div>

                  {/* Right — score */}
                  <div className="flex flex-col items-end shrink-0 ml-4">
                    <span
                      className={`text-lg font-bold tabular-nums ${styles.score}`}
                    >
                      {follower.botScore}
                    </span>
                    <span className="text-zinc-600 text-[10px] uppercase tracking-wide">
                      bot score
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
