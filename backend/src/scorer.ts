import { Follower, FlaggedField, Reason } from "./types";

// --- Username heuristics ---

function gibberishScore(username: string): number {
  const clean = username.replace(/[^a-zA-Z]/g, "").toLowerCase();
  if (clean.length < 3) return 0;
  const vowels = new Set(["a", "e", "i", "o", "u"]);
  let maxRun = 0;
  let run = 0;
  for (const c of clean) {
    if (!vowels.has(c)) { run++; maxRun = Math.max(maxRun, run); }
    else run = 0;
  }
  const vowelRatio = [...clean].filter((c) => vowels.has(c)).length / clean.length;
  let score = 0;
  if (maxRun >= 5) score += 0.5;
  else if (maxRun >= 4) score += 0.2;
  if (vowelRatio < 0.15) score += 0.4;
  return Math.min(score, 1.0);
}

function hasRandomPattern(username: string): boolean {
  const clean = username.replace(/[._]/g, "");
  return /^[a-zA-Z]{1,3}\d{4,}$/.test(clean) || /^[a-z]{1,4}\d{3,}[a-z]*$/.test(clean);
}

function hasEmailProvider(username: string): boolean {
  return /gmai|yahoo|hotma|outlook|proton/.test(username.toLowerCase());
}

function hasRepeatedChars(username: string): boolean {
  return /(.)\1{3,}/.test(username.replace(/[._]/g, ""));
}

function hasUnderscorePadding(username: string): boolean {
  const leading = username.length - username.replace(/^_+/, "").length;
  const trailing = username.length - username.replace(/_+$/, "").length;
  return leading + trailing >= 2;
}

// --- Main scoring function ---

export function scoreAccount(
  account: Follower
): { botScore: number; flaggedFields: FlaggedField[]; reasons: Reason[] } {
  let score = 0;
  const flaggedFields: FlaggedField[] = [];
  const reasons: Reason[] = [];

  // 1. Follower / following ratio
  const ratio = account.followerCount / Math.max(account.followingCount, 1);
  if (ratio < 0.05) {
    score += 25;
    flaggedFields.push("followers", "following");
    reasons.push({ text: "Follows thousands, almost no followers back", severity: "high" });
  } else if (ratio < 0.1) {
    score += 15;
    flaggedFields.push("followers", "following");
    reasons.push({ text: "Very high following-to-follower ratio", severity: "high" });
  } else if (ratio < 0.3) {
    score += 8;
    flaggedFields.push("following");
    reasons.push({ text: "Slightly high following ratio", severity: "low" });
  }

  // 2. Post count
  if (account.postCount === 0) {
    score += 20;
    flaggedFields.push("posts");
    reasons.push({ text: "Zero posts", severity: "high" });
  } else if (account.postCount <= 3) {
    score += 12;
    flaggedFields.push("posts");
    reasons.push({ text: "Very few posts", severity: "medium" });
  } else if (account.postCount <= 10) {
    score += 5;
    flaggedFields.push("posts");
    reasons.push({ text: "Low post count", severity: "low" });
  }

  // 3. Spam keywords in username
  const spamKeywords = [
    "follow4follow", "free_likes", "buy_ig", "promo", "boost", "auto_",
    "sale", "shop", "deal", "free", "win", "click", "crypto", "forex",
    "earn", "income", "invest", "dm_for", "collab",
  ];
  if (spamKeywords.some((kw) => account.username.toLowerCase().includes(kw))) {
    score += 20;
    reasons.push({ text: "Spam keyword in username", severity: "high" });
  }

  // 4. Username pattern signals
  const username = account.username;

  if (hasEmailProvider(username)) {
    score += 15;
    reasons.push({ text: "Email provider name in username", severity: "high" });
  }

  if (hasRandomPattern(username)) {
    score += 12;
    reasons.push({ text: "Random character pattern in username", severity: "medium" });
  } else if (/[_.]?\d{4,}$/.test(username)) {
    score += 8;
    reasons.push({ text: "Long numeric suffix in username", severity: "medium" });
  }

  const gs = gibberishScore(username);
  if (gs >= 0.7) {
    score += 12;
    reasons.push({ text: "Username looks like random characters", severity: "medium" });
  } else if (gs >= 0.4) {
    score += 6;
    reasons.push({ text: "Username has low readability", severity: "low" });
  }

  if (hasRepeatedChars(username)) {
    score += 8;
    reasons.push({ text: "Repeated characters in username", severity: "low" });
  }

  if (hasUnderscorePadding(username)) {
    score += 5;
    reasons.push({ text: "Unusual underscore padding in username", severity: "low" });
  }

  // 5. Account age
  const accountAge = Date.now() - new Date(account.createdAt).getTime();
  const days = accountAge / (1000 * 60 * 60 * 24);
  if (days < 30) {
    score += 10;
    flaggedFields.push("age");
    reasons.push({ text: "Account less than 30 days old", severity: "high" });
  } else if (days < 90) {
    score += 5;
    flaggedFields.push("age");
    reasons.push({ text: "Account less than 90 days old", severity: "medium" });
  }

  // 6. Known bot override
  if (account.isKnownBot) {
    score = Math.max(score, 90);
    reasons.push({ text: "Known bot account", severity: "high" });
  }

  const uniqueFields = [...new Set(flaggedFields)] as FlaggedField[];

  return {
    botScore: Math.min(score, 100),
    flaggedFields: uniqueFields,
    reasons,
  };
}
