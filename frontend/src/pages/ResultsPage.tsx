import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

type RiskLevel = "high" | "medium" | "low" | "real";
type FilterType = "all" | RiskLevel;

interface Follower {
  id: string;
  username: string;
  displayName: string;
  botScore: number;
  isKnownBot: boolean;
  reasons: string[];
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
    reasons: ["Known bot account", "Spam keyword in username", "0 posts", "Follows 8,400 · 12 followers"],
  },
  {
    id: "2",
    username: "free.insta.likes99",
    displayName: "Free Likes ✨",
    botScore: 94,
    isKnownBot: true,
    reasons: ["Known bot account", "Spam keyword in username", "No profile picture"],
  },
  {
    id: "3",
    username: "buy_ig_followers1",
    displayName: "IG Growth",
    botScore: 91,
    isKnownBot: false,
    reasons: ["Spam keyword in username", "0 posts", "Follows 12,000 · 3 followers"],
  },
  {
    id: "4",
    username: "promo_boost_22",
    displayName: "Promo Boost",
    botScore: 88,
    isKnownBot: true,
    reasons: ["Known bot account", "Promo keyword in username", "No bio"],
  },
  {
    id: "5",
    username: "spam_acc_4421",
    displayName: "",
    botScore: 85,
    isKnownBot: false,
    reasons: ["Spam keyword in username", "No display name", "No profile picture", "Account < 30 days old"],
  },
  {
    id: "6",
    username: "auto_liker_bot",
    displayName: "Auto Liker",
    botScore: 82,
    isKnownBot: true,
    reasons: ["Known bot account", "Bot keyword in username", "0 posts"],
  },
  {
    id: "7",
    username: "brand_deals_offer",
    displayName: "Brand Deals 💰",
    botScore: 79,
    isKnownBot: false,
    reasons: ["Promo keyword in username", "Follows 5,200 · 18 followers", "Suspicious bio link"],
  },
  {
    id: "8",
    username: "ghost_user_2291",
    displayName: "",
    botScore: 76,
    isKnownBot: false,
    reasons: ["No display name", "No profile picture", "0 posts", "Account < 90 days old"],
  },
  {
    id: "9",
    username: "influx_media_co",
    displayName: "Influx Media",
    botScore: 68,
    isKnownBot: false,
    reasons: ["Follows 3,100 · 44 followers", "No posts", "Generic bio"],
  },
  {
    id: "10",
    username: "social_bxst",
    displayName: "Social Boost",
    botScore: 63,
    isKnownBot: true,
    reasons: ["Known bot account", "Boost keyword in username"],
  },
  {
    id: "11",
    username: "trendy.clips.daily",
    displayName: "Trendy Clips",
    botScore: 57,
    isKnownBot: false,
    reasons: ["High post frequency", "Follows 2,800 · 91 followers"],
  },
  {
    id: "12",
    username: "viralpage_hq",
    displayName: "Viral Page HQ",
    botScore: 51,
    isKnownBot: false,
    reasons: ["Follows 1,900 · 120 followers", "No bio"],
  },
  {
    id: "13",
    username: "mia.thompson92",
    displayName: "Mia Thompson",
    botScore: 44,
    isKnownBot: false,
    reasons: ["Follows 900 · 210 followers", "Account < 90 days old"],
  },
  {
    id: "14",
    username: "new_user_39182",
    displayName: "",
    botScore: 38,
    isKnownBot: false,
    reasons: ["No display name", "Numeric suffix in username", "Account < 90 days old"],
  },
  {
    id: "15",
    username: "photography_hub",
    displayName: "Photography Hub",
    botScore: 29,
    isKnownBot: false,
    reasons: ["Follows 600 · 480 followers"],
  },
  {
    id: "16",
    username: "carlos_dev",
    displayName: "Carlos Dev",
    botScore: 21,
    isKnownBot: false,
    reasons: ["Low engagement rate"],
  },
  {
    id: "17",
    username: "linaaa.k",
    displayName: "Lina K.",
    botScore: 14,
    isKnownBot: false,
    reasons: ["Few posts"],
  },
  {
    id: "18",
    username: "james.b.photo",
    displayName: "James B.",
    botScore: 6,
    isKnownBot: false,
    reasons: [],
  },
  {
    id: "19",
    username: "sara_designs",
    displayName: "Sara Designs",
    botScore: 4,
    isKnownBot: false,
    reasons: [],
  },
  {
    id: "20",
    username: "ofek_real",
    displayName: "Ofek",
    botScore: 1,
    isKnownBot: false,
    reasons: [],
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

const LOADING_STEPS = [
  "Fetching followers…",
  "Analyzing usernames…",
  "Checking profile signals…",
  "Computing bot scores…",
  "Almost done…",
];

function LoadingView({ profile }: { profile: string }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 800);
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 95));
    }, 40);
    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-sm ig-gradient opacity-20" />
          <div
            className="absolute inset-0 rounded-sm border-2 border-transparent animate-spin"
            style={{
              background:
                "linear-gradient(#0a0a0a, #0a0a0a) padding-box, linear-gradient(45deg, #833ab4, #fd1d1d, #fcaf45) border-box",
              animationDuration: "900ms",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 opacity-60"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-white text-sm font-medium">
            Scanning{" "}
            <span className="ig-gradient-text font-semibold">@{profile}</span>
          </p>
          <p className="text-zinc-500 text-xs h-4 transition-all duration-300">
            {LOADING_STEPS[step]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="w-full h-1 bg-zinc-800 rounded-sm overflow-hidden">
            <div
              className="h-full ig-gradient transition-all duration-75 ease-linear rounded-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-zinc-700 text-[10px] text-right tabular-nums">
            {progress}%
          </p>
        </div>

        {/* Skeleton rows */}
        <div className="w-full flex flex-col gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 rounded-sm border-l-4 border-l-zinc-800 bg-zinc-900/20 animate-pulse"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="flex flex-col gap-1.5">
                <div
                  className="h-3 bg-zinc-800 rounded-sm"
                  style={{ width: `${90 + i * 15}px` }}
                />
                <div className="h-2.5 w-16 bg-zinc-800/60 rounded-sm" />
              </div>
              <div className="h-6 w-8 bg-zinc-800 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function StatCard({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  const animated = useCountUp(value, 900);
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>
        {animated}
      </span>
      <span className="text-zinc-600 text-[10px] uppercase tracking-wide text-center">
        {label}
      </span>
    </div>
  );
}

function Tooltip({ reasons }: { reasons: string[] }) {
  return (
    <div className="absolute right-0 top-full mt-1.5 z-10 w-56 bg-zinc-900 border border-zinc-700 rounded-sm shadow-xl p-3 flex flex-col gap-1.5">
      {reasons.map((r, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-zinc-500 mt-0.5 shrink-0">·</span>
          <span className="text-zinc-300 text-xs leading-snug">{r}</span>
        </div>
      ))}
    </div>
  );
}

function FollowerRow({
  follower,
  index,
}: {
  follower: Follower;
  index: number;
}) {
  const risk = getRiskLevel(follower.botScore);
  const styles = RISK_STYLES[risk];
  const animatedScore = useCountUp(follower.botScore, 600 + index * 30);
  const [showTooltip, setShowTooltip] = useState(false);
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 40);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (!showTooltip) return;
    function handleClick(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTooltip]);

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-sm border-l-4 ${styles.row} ${styles.border} transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
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

      {/* Right — score + tooltip trigger */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <div className="flex flex-col items-end">
          <span className={`text-lg font-bold tabular-nums ${styles.score}`}>
            {animatedScore}
          </span>
          <span className="text-zinc-600 text-[10px] uppercase tracking-wide">
            bot score
          </span>
        </div>

        {follower.reasons.length > 0 && (
          <div className="relative" ref={tooltipRef}>
            <button
              onClick={() => setShowTooltip((v) => !v)}
              className="w-5 h-5 rounded-sm border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors flex items-center justify-center text-xs cursor-pointer"
              aria-label="Why this score?"
            >
              ?
            </button>
            {showTooltip && <Tooltip reasons={follower.reasons} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profile = searchParams.get("profile") ?? "";

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingView profile={profile} />;

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

  const botPercent = Math.round(((counts.high + counts.medium) / counts.all) * 100);

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
        </div>

        {/* Stat bar */}
        <div className="border border-zinc-800 rounded-sm bg-zinc-900/30 px-6 py-5 flex flex-col gap-4">
          <div className="flex divide-x divide-zinc-800">
            <StatCard value={counts.all} label="Scanned" color="text-white" />
            <StatCard value={counts.high} label="High Risk" color="text-red-400" />
            <StatCard value={counts.medium} label="Medium" color="text-yellow-400" />
            <StatCard value={counts.low} label="Low Risk" color="text-green-400" />
            <StatCard value={counts.real} label="Real" color="text-zinc-400" />
          </div>

          {/* Bot percentage bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wide">
                Suspected bots
              </span>
              <span className="text-zinc-400 text-[10px] tabular-nums">
                {botPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-sm overflow-hidden">
              <div
                className="h-full ig-gradient rounded-sm transition-all duration-1000 ease-out"
                style={{ width: `${botPercent}%` }}
              />
            </div>
          </div>
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
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-sm border border-green-800 bg-green-950/30 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-green-400"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-white text-sm font-medium">All clear</p>
                <p className="text-zinc-500 text-xs">
                  No accounts in this category.
                </p>
              </div>
            </div>
          ) : (
            filtered.map((follower, index) => (
              <FollowerRow key={follower.id} follower={follower} index={index} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
