export type FlaggedField = "followers" | "following" | "posts" | "age";

export interface Reason {
  text: string;
  severity: "high" | "medium" | "low";
}

export interface Follower {
  id: string;
  username: string;
  displayName: string;
  botScore: number;        // 0–100
  isKnownBot: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: string;       // inferred from earliest post — Instagram doesn't expose creation date
  flaggedFields: FlaggedField[];
  reasons: Reason[];
}
