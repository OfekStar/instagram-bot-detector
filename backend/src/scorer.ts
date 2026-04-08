import { Follower, FlaggedField, Reason } from "./types";

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

  // 3. Username pattern — spam keywords
  const spamKeywords = ["follow4follow", "free_likes", "buy_ig", "promo", "boost", "auto_"];
  const hasSpamKeyword = spamKeywords.some((kw) =>
    account.username.toLowerCase().includes(kw)
  );
  if (hasSpamKeyword) {
    score += 20;
    reasons.push({ text: "Spam keyword in username", severity: "high" });
  }

  // 4. Numeric suffix (e.g. user_48291)
  if (/[_.]?\d{4,}$/.test(account.username)) {
    score += 8;
    reasons.push({ text: "Long numeric suffix in username", severity: "medium" });
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

  // Deduplicate flaggedFields
  const uniqueFields = [...new Set(flaggedFields)] as FlaggedField[];

  return {
    botScore: Math.min(score, 100),
    flaggedFields: uniqueFields,
    reasons,
  };
}
