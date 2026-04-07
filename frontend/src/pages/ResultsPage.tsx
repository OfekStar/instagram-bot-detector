import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useNavigate } from "react-router-dom";

type RiskLevel = "high" | "medium" | "low" | "real";
type FilterType = "all" | RiskLevel;
type FlaggedField = "followers" | "following" | "posts" | "age";

interface Reason {
  text: string;
  severity: "high" | "medium" | "low";
}

interface Follower {
  id: string;
  username: string;
  displayName: string;
  botScore: number;
  isKnownBot: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: string;
  flaggedFields: FlaggedField[];
  reasons: Reason[];
}

const FIELD_REASONS: Record<FlaggedField, Reason> = {
  followers: { text: "Very few followers",              severity: "medium" },
  following: { text: "Follows an unusually high number of accounts", severity: "high" },
  posts:     { text: "No posts or extremely few posts", severity: "high" },
  age:       { text: "Very new or recently created account", severity: "medium" },
};

function getReasons(follower: Follower): Reason[] {
  if (follower.reasons.length > 0) return follower.reasons;
  return follower.flaggedFields.map((f) => FIELD_REASONS[f]);
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "high";
  if (score >= 40) return "medium";
  if (score >= 10) return "low";
  return "real";
}

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

const MOCK_FOLLOWERS: Follower[] = [
  {
    id: "1", username: "xX_follow4follow_Xx", displayName: "Follow4Follow",
    botScore: 97, isKnownBot: true,
    followerCount: 12, followingCount: 8400, postCount: 0, createdAt: "Mar 2024",
    flaggedFields: ["followers", "following", "posts", "age"],
    reasons: [
      { text: "Known bot account", severity: "high" },
      { text: "Spam keyword in username", severity: "high" },
    ],
  },
  {
    id: "2", username: "free.insta.likes99", displayName: "Free Likes ✨",
    botScore: 94, isKnownBot: true,
    followerCount: 8, followingCount: 6200, postCount: 0, createdAt: "Jan 2024",
    flaggedFields: ["followers", "following", "posts"],
    reasons: [
      { text: "Known bot account", severity: "high" },
      { text: "Spam keyword in username", severity: "high" },
    ],
  },
  {
    id: "3", username: "buy_ig_followers1", displayName: "IG Growth",
    botScore: 91, isKnownBot: false,
    followerCount: 3, followingCount: 12000, postCount: 0, createdAt: "Nov 2023",
    flaggedFields: ["followers", "following", "posts"],
    reasons: [
      { text: "Spam keyword in username", severity: "high" },
    ],
  },
  {
    id: "4", username: "promo_boost_22", displayName: "Promo Boost",
    botScore: 88, isKnownBot: true,
    followerCount: 41, followingCount: 4800, postCount: 2, createdAt: "Feb 2024",
    flaggedFields: ["following", "age"],
    reasons: [
      { text: "Known bot account", severity: "high" },
      { text: "Promo keyword in username", severity: "high" },
    ],
  },
  {
    id: "5", username: "spam_acc_4421", displayName: "",
    botScore: 85, isKnownBot: false,
    followerCount: 0, followingCount: 3100, postCount: 0, createdAt: "Mar 2026",
    flaggedFields: ["followers", "following", "posts", "age"],
    reasons: [
      { text: "Spam keyword in username", severity: "high" },
    ],
  },
  {
    id: "6", username: "auto_liker_bot", displayName: "Auto Liker",
    botScore: 82, isKnownBot: true,
    followerCount: 22, followingCount: 9100, postCount: 0, createdAt: "Aug 2023",
    flaggedFields: ["followers", "following", "posts"],
    reasons: [
      { text: "Known bot account", severity: "high" },
      { text: "Bot keyword in username", severity: "high" },
    ],
  },
  {
    id: "7", username: "brand_deals_offer", displayName: "Brand Deals 💰",
    botScore: 79, isKnownBot: false,
    followerCount: 18, followingCount: 5200, postCount: 4, createdAt: "Jun 2023",
    flaggedFields: ["followers", "following"],
    reasons: [
      { text: "Promo keyword in username", severity: "high" },
      { text: "Suspicious bio link", severity: "medium" },
    ],
  },
  {
    id: "8", username: "ghost_user_2291", displayName: "",
    botScore: 76, isKnownBot: false,
    followerCount: 1, followingCount: 2700, postCount: 0, createdAt: "Feb 2026",
    flaggedFields: ["followers", "following", "posts", "age"],
    reasons: [],
  },
  {
    id: "9", username: "influx_media_co", displayName: "Influx Media",
    botScore: 68, isKnownBot: false,
    followerCount: 44, followingCount: 3100, postCount: 0, createdAt: "Sep 2023",
    flaggedFields: ["following", "posts"],
    reasons: [
      { text: "Generic bio", severity: "low" },
    ],
  },
  {
    id: "10", username: "social_bxst", displayName: "Social Boost",
    botScore: 63, isKnownBot: true,
    followerCount: 310, followingCount: 4400, postCount: 7, createdAt: "Apr 2022",
    flaggedFields: ["following"],
    reasons: [
      { text: "Known bot account", severity: "high" },
      { text: "Boost keyword in username", severity: "high" },
    ],
  },
  {
    id: "11", username: "trendy.clips.daily", displayName: "Trendy Clips",
    botScore: 57, isKnownBot: false,
    followerCount: 91, followingCount: 2800, postCount: 312, createdAt: "Jul 2022",
    flaggedFields: ["following"],
    reasons: [
      { text: "High post frequency", severity: "medium" },
    ],
  },
  {
    id: "12", username: "viralpage_hq", displayName: "Viral Page HQ",
    botScore: 51, isKnownBot: false,
    followerCount: 120, followingCount: 1900, postCount: 14, createdAt: "Jan 2022",
    flaggedFields: ["following"],
    reasons: [
      { text: "No bio", severity: "low" },
    ],
  },
  {
    id: "13", username: "mia.thompson92", displayName: "Mia Thompson",
    botScore: 44, isKnownBot: false,
    followerCount: 210, followingCount: 900, postCount: 23, createdAt: "Jan 2026",
    flaggedFields: ["age"],
    reasons: [],
  },
  {
    id: "14", username: "new_user_39182", displayName: "",
    botScore: 38, isKnownBot: false,
    followerCount: 5, followingCount: 440, postCount: 1, createdAt: "Feb 2026",
    flaggedFields: ["followers", "age"],
    reasons: [
      { text: "Numeric suffix in username", severity: "medium" },
    ],
  },
  {
    id: "15", username: "photography_hub", displayName: "Photography Hub",
    botScore: 29, isKnownBot: false,
    followerCount: 480, followingCount: 600, postCount: 88, createdAt: "Mar 2020",
    flaggedFields: [],
    reasons: [
      { text: "Following/follower ratio", severity: "low" },
    ],
  },
  {
    id: "16", username: "carlos_dev", displayName: "Carlos Dev",
    botScore: 21, isKnownBot: false,
    followerCount: 820, followingCount: 310, postCount: 45, createdAt: "Nov 2019",
    flaggedFields: [],
    reasons: [
      { text: "Low engagement rate", severity: "low" },
    ],
  },
  {
    id: "17", username: "linaaa.k", displayName: "Lina K.",
    botScore: 14, isKnownBot: false,
    followerCount: 1200, followingCount: 430, postCount: 18, createdAt: "May 2021",
    flaggedFields: [],
    reasons: [
      { text: "Few posts", severity: "low" },
    ],
  },
  {
    id: "18", username: "james.b.photo", displayName: "James B.",
    botScore: 6, isKnownBot: false,
    followerCount: 3400, followingCount: 280, postCount: 142, createdAt: "Aug 2018",
    flaggedFields: [],
    reasons: [],
  },
  {
    id: "19", username: "sara_designs", displayName: "Sara Designs",
    botScore: 4, isKnownBot: false,
    followerCount: 5100, followingCount: 310, postCount: 97, createdAt: "Mar 2019",
    flaggedFields: [],
    reasons: [],
  },
  {
    id: "20", username: "ofek_real", displayName: "Ofek",
    botScore: 1, isKnownBot: false,
    followerCount: 8200, followingCount: 420, postCount: 204, createdAt: "Jun 2017",
    flaggedFields: [],
    reasons: [],
  },
];

const RISK_STYLES: Record<RiskLevel, { row: string; border: string; score: string }> = {
  high:   { row: "bg-red-950/20",    border: "border-l-red-500",    score: "text-red-400" },
  medium: { row: "bg-yellow-950/20", border: "border-l-yellow-500", score: "text-yellow-400" },
  low:    { row: "bg-green-950/20",  border: "border-l-green-500",  score: "text-green-400" },
  real:   { row: "bg-zinc-900/10",   border: "border-l-zinc-700",   score: "text-zinc-500" },
};

const SEVERITY_STYLES: Record<Reason["severity"], { dot: string; text: string }> = {
  high:   { dot: "bg-red-400",    text: "text-red-300" },
  medium: { dot: "bg-yellow-400", text: "text-yellow-200" },
  low:    { dot: "bg-zinc-500",   text: "text-zinc-300" },
};

const LOADING_STEPS = [
  "Fetching followers…",
  "Analyzing usernames…",
  "Checking profile signals…",
  "Computing bot scores…",
  "Almost done…",
];

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingView({ profile }: { profile: string }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 800);
    const progressInterval = setInterval(() => setProgress((p) => Math.min(p + 1, 95)), 40);
    return () => { clearInterval(stepInterval); clearInterval(progressInterval); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-sm ig-gradient opacity-20" />
          <div className="absolute inset-0 rounded-sm border-2 border-transparent animate-spin"
            style={{ background: "linear-gradient(#0a0a0a, #0a0a0a) padding-box, linear-gradient(45deg, #833ab4, #fd1d1d, #fcaf45) border-box", animationDuration: "900ms" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-60">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-white text-sm font-medium">Scanning <span className="ig-gradient-text font-semibold">@{profile}</span></p>
          <p className="text-zinc-500 text-xs h-4">{LOADING_STEPS[step]}</p>
        </div>
        <div className="w-full flex flex-col gap-1.5">
          <div className="w-full h-1 bg-zinc-800 rounded-sm overflow-hidden">
            <div className="h-full ig-gradient transition-all duration-75 ease-linear rounded-sm" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-zinc-700 text-[10px] text-right tabular-nums">{progress}%</p>
        </div>
        <div className="w-full flex flex-col gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-sm border-l-4 border-l-zinc-800 bg-zinc-900/20 animate-pulse" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="flex flex-col gap-1.5">
                <div className="h-3 bg-zinc-800 rounded-sm" style={{ width: `${90 + i * 15}px` }} />
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

// ─── Hooks ────────────────────────────────────────────────────────────────────

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

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const TOOLTIP_STYLES: Record<RiskLevel, { border: string; header: string }> = {
  high:   { border: "border-red-800",    header: "bg-red-950/80" },
  medium: { border: "border-yellow-800", header: "bg-yellow-950/80" },
  low:    { border: "border-green-800",  header: "bg-green-950/80" },
  real:   { border: "border-zinc-700",   header: "bg-zinc-800" },
};

function Tooltip({ reasons, x, y, risk }: { reasons: Reason[]; x: number; y: number; risk: RiskLevel }) {
  if (reasons.length === 0) return null;
  const ts = TOOLTIP_STYLES[risk];
  return createPortal(
    <div className={`fixed z-50 w-64 bg-zinc-900 border ${ts.border} rounded-sm shadow-2xl overflow-hidden pointer-events-none`} style={{ left: x + 16, top: y + 12 }}>
      <div className={`px-3 py-2 border-b ${ts.border} ${ts.header}`}>
        <span className="text-white text-[11px] font-semibold uppercase tracking-wider">Why this score?</span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {reasons.map((r, i) => {
          const s = SEVERITY_STYLES[r.severity];
          return (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full ${s.dot} mt-1.5 shrink-0`} />
              <span className={`text-xs leading-snug ${s.text}`}>{r.text}</span>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

// ─── Stat chip (inside expanded row) ─────────────────────────────────────────

function StatChip({ label, value, flagged }: { label: string; value: string; flagged: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 px-3 py-2 rounded-sm ${flagged ? "bg-red-950/60 border border-red-800/60" : "bg-zinc-800/40 border border-zinc-700/40"}`}>
      <span className={`text-sm font-semibold leading-none tabular-nums ${flagged ? "text-red-300" : "text-white"}`}>{value}</span>
      <span className={`text-[10px] uppercase tracking-wide ${flagged ? "text-red-500" : "text-zinc-500"}`}>{label}</span>
    </div>
  );
}

// ─── Follower row ─────────────────────────────────────────────────────────────

const SCORE_GLOW: Record<RiskLevel, string> = {
  high:   "0 0 18px #ef444480",
  medium: "0 0 18px #eab30880",
  low:    "0 0 18px #22c55e80",
  real:   "none",
};

function FollowerRow({ follower, index }: { follower: Follower; index: number }) {
  const risk = getRiskLevel(follower.botScore);
  const styles = RISK_STYLES[risk];
  const animatedScore = useCountUp(follower.botScore, 600 + index * 30);
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 40);
    return () => clearTimeout(t);
  }, [index]);

  useEffect(() => {
    const hide = () => { setShowTooltip(false); setMousePos(null); };
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, []);

  const reasons = getReasons(follower);
  const hasInfo = reasons.length > 0 || follower.flaggedFields.length > 0;

  return (
    <div className={`rounded-sm border-l-4 ${styles.border} transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
      {/* Main row */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${styles.row} ${hasInfo ? "cursor-pointer" : ""} hover:brightness-105 transition-all duration-150`}
        onClick={() => hasInfo && setExpanded((v) => !v)}
        onMouseEnter={() => reasons.length > 0 && setShowTooltip(true)}
        onMouseLeave={() => { setShowTooltip(false); setMousePos(null); }}
        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-white text-sm font-bold truncate">@{follower.username}</span>
            {follower.isKnownBot && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-red-900/60 text-red-300 shrink-0">Known Bot</span>
            )}
          </div>
          {follower.displayName ? <span className="text-zinc-500 text-xs truncate">{follower.displayName}</span> : null}
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="flex flex-col items-end">
            <span className={`text-xl font-black tabular-nums ${styles.score}`} style={{ textShadow: SCORE_GLOW[risk] }}>{animatedScore}</span>
            <span className="text-zinc-600 text-[10px] uppercase tracking-widest">score</span>
          </div>
          {hasInfo && (
            <span className={`text-zinc-500 text-xs transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
          )}
        </div>

        {showTooltip && mousePos && (
          <Tooltip reasons={reasons} x={mousePos.x} y={mousePos.y} risk={risk} />
        )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className={`${styles.row} border-t border-zinc-800/60 px-4 py-3 flex gap-2 flex-wrap`}>
          <StatChip label="followers" value={fmt(follower.followerCount)} flagged={follower.flaggedFields.includes("followers")} />
          <StatChip label="following" value={fmt(follower.followingCount)} flagged={follower.flaggedFields.includes("following")} />
          <StatChip label="posts" value={String(follower.postCount)} flagged={follower.flaggedFields.includes("posts")} />
          <StatChip label="first post" value={follower.createdAt} flagged={follower.flaggedFields.includes("age")} />
        </div>
      )}
    </div>
  );
}

// ─── Grade ────────────────────────────────────────────────────────────────────

const GRADE_META: Record<string, { color: string; glow: string; label: string }> = {
  A: { color: "text-green-400",  glow: "#22c55e", label: "Very clean" },
  B: { color: "text-lime-400",   glow: "#84cc16", label: "Mostly real" },
  C: { color: "text-yellow-400", glow: "#eab308", label: "Mixed" },
  D: { color: "text-orange-400", glow: "#f97316", label: "Suspicious" },
  F: { color: "text-red-400",    glow: "#ef4444", label: "Highly botted" },
};

function getBotGrade(percent: number): { grade: string; color: string; label: string } {
  if (percent < 10) return { grade: "A", ...GRADE_META["A"] };
  if (percent < 25) return { grade: "B", ...GRADE_META["B"] };
  if (percent < 40) return { grade: "C", ...GRADE_META["C"] };
  if (percent < 60) return { grade: "D", ...GRADE_META["D"] };
  return { grade: "F", ...GRADE_META["F"] };
}

function GradeLetter({ letter }: { letter: string }) {
  const glow = GRADE_META[letter]?.glow ?? "#888";
  const id = `metal-${letter}`;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" aria-label={`Grade ${letter}`}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#2e2e2e" />
          <stop offset="18%"  stopColor="#b0b0b0" />
          <stop offset="35%"  stopColor="#ffffff" />
          <stop offset="50%"  stopColor="#888888" />
          <stop offset="68%"  stopColor="#444444" />
          <stop offset="83%"  stopColor="#d4d4d4" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
        <filter id={`glow-${letter}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="blur" />
        </filter>
      </defs>
      {/* Colored glow halo */}
      <text x="55" y="92" textAnchor="middle" fontSize="108"
        fontFamily="'Bebas Neue', sans-serif"
        fill={glow} filter={`url(#glow-${letter})`} opacity="0.55"
      >{letter}</text>
      {/* Metallic letter */}
      <text x="55" y="92" textAnchor="middle" fontSize="108"
        fontFamily="'Bebas Neue', sans-serif"
        fill={`url(#${id})`}
      >{letter}</text>
    </svg>
  );
}

// ─── Stat card (filter bar) ───────────────────────────────────────────────────

function StatCard({ value, label, color, active, onClick }: { value: number; label: string; color: string; active: boolean; onClick: () => void }) {
  const animated = useCountUp(value, 900);
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 rounded-sm transition-colors cursor-pointer ${active ? "bg-zinc-800/60" : "hover:bg-zinc-800/30"}`}>
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{animated}</span>
      <span className={`text-[10px] uppercase tracking-wide text-center transition-colors ${active ? "text-zinc-300" : "text-zinc-600"}`}>{label}</span>
      {active && <div className={`h-0.5 w-4 rounded-sm ${color.replace("text-", "bg-")}`} />}
    </button>
  );
}

// ─── Results page ─────────────────────────────────────────────────────────────

const MOCK_PROFILE = { followers: 12400, following: 891, posts: 234 };

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profile = searchParams.get("profile") ?? "";
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [barMounted, setBarMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setBarMounted(true), 150);
      return () => clearTimeout(t);
    }
  }, [loading]);

  if (loading) return <LoadingView profile={profile} />;

  const sorted = [...MOCK_FOLLOWERS].sort((a, b) => b.botScore - a.botScore);
  const filtered = filter === "all" ? sorted : sorted.filter((f) => getRiskLevel(f.botScore) === filter);
  const counts = {
    all: sorted.length,
    high: sorted.filter((f) => getRiskLevel(f.botScore) === "high").length,
    medium: sorted.filter((f) => getRiskLevel(f.botScore) === "medium").length,
    low: sorted.filter((f) => getRiskLevel(f.botScore) === "low").length,
    real: sorted.filter((f) => getRiskLevel(f.botScore) === "real").length,
  };
  const botPercent = Math.round(((counts.high + counts.medium) / counts.all) * 100);
  const grade = getBotGrade(botPercent);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-8">

        {/* Back */}
        <button onClick={() => navigate("/")} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors self-start cursor-pointer">
          ← Back
        </button>

        {/* Profile header — open, no box */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 ig-gradient rounded-sm flex items-center justify-center shrink-0">
            <span className="text-white font-black text-2xl uppercase select-none">{profile[0] ?? "?"}</span>
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-white font-bold text-xl tracking-tight">@{profile}</span>
              <a href={`https://instagram.com/${profile}`} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors w-fit">
                instagram.com/{profile} ↗
              </a>
            </div>
            <div className="flex gap-5 items-center">
              <span className="text-zinc-400 text-xs"><span className="text-white font-semibold">{fmt(MOCK_PROFILE.followers)}</span> followers</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-400 text-xs"><span className="text-white font-semibold">{fmt(MOCK_PROFILE.following)}</span> following</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-400 text-xs"><span className="text-white font-semibold">{MOCK_PROFILE.posts}</span> posts</span>
            </div>
          </div>
        </div>

        {/* Grade — hero element */}
        <div className="flex items-end gap-6">
          <div className="flex flex-col gap-0">
            <GradeLetter letter={grade.grade} />
            <span className={`text-xs uppercase tracking-widest font-semibold -mt-1 ${grade.color}`}>{grade.label}</span>
          </div>
          <div className="flex-1 pb-2 flex flex-col gap-3">
            {/* Breakdown bar — animates in */}
            <div className="w-full h-2 flex rounded-sm overflow-hidden gap-px origin-left transition-transform duration-700 ease-out" style={{ transform: barMounted ? "scaleX(1)" : "scaleX(0)" }}>
              {counts.high > 0   && <div className="bg-red-500 h-full"    style={{ flex: counts.high }} />}
              {counts.medium > 0 && <div className="bg-yellow-500 h-full" style={{ flex: counts.medium }} />}
              {counts.low > 0    && <div className="bg-green-600 h-full"  style={{ flex: counts.low }} />}
              {counts.real > 0   && <div className="bg-zinc-700 h-full"   style={{ flex: counts.real }} />}
            </div>
            <div className="flex gap-3">
              <span className="text-red-400 text-[10px]">{counts.high} high</span>
              <span className="text-yellow-400 text-[10px]">{counts.medium} medium</span>
              <span className="text-green-400 text-[10px]">{counts.low} low</span>
              <span className="text-zinc-500 text-[10px]">{counts.real} real</span>
            </div>
          </div>
        </div>

        {/* Filter stat bar */}
        <div className="flex divide-x divide-zinc-800 border border-zinc-800 rounded-sm">
          <StatCard value={counts.all}    label="All"       color="text-white"       active={filter === "all"}    onClick={() => setFilter("all")} />
          <StatCard value={counts.high}   label="High Risk" color="text-red-400"     active={filter === "high"}   onClick={() => setFilter("high")} />
          <StatCard value={counts.medium} label="Medium"    color="text-yellow-400"  active={filter === "medium"} onClick={() => setFilter("medium")} />
          <StatCard value={counts.low}    label="Low Risk"  color="text-green-400"   active={filter === "low"}    onClick={() => setFilter("low")} />
          <StatCard value={counts.real}   label="Real"      color="text-zinc-400"    active={filter === "real"}   onClick={() => setFilter("real")} />
        </div>

        {/* Account list */}
        <div className="flex flex-col gap-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-sm border border-green-800 bg-green-950/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-400">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-white text-sm font-medium">All clear</p>
                <p className="text-zinc-500 text-xs">No accounts in this category.</p>
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
