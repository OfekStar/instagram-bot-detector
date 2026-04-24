import { describe, it, expect } from "vitest";
import { scoreAccount } from "./scorer";
import { Follower } from "./types";

const baseAccount: Follower = {
  id: "1",
  username: "normal_user",
  displayName: "Normal User",
  botScore: 0,
  isKnownBot: false,
  followerCount: 500,
  followingCount: 300,
  postCount: 20,
  createdAt: "2020-01-01",
  flaggedFields: [],
  reasons: [],
};

describe("scoreAccount", () => {
  it("gives a high score when following thousands but has no followers", () => {
    const account: Follower = {
      ...baseAccount,
      followerCount: 0,
      followingCount: 1000,
    };

    const { botScore } = scoreAccount(account);

    expect(botScore).toBeGreaterThanOrEqual(25);
  });

  it("gives a high score when account has zero posts", () => {
    const account: Follower = {
      ...baseAccount,
      postCount: 0,
    };

    const { botScore } = scoreAccount(account);

    expect(botScore).toBeGreaterThanOrEqual(20);
  });

  it("gives a high score when username contains a spam keyword", () => {
    const account: Follower = {
      ...baseAccount,
      username: "free_likes_here",
    };

    const { botScore } = scoreAccount(account);

    expect(botScore).toBeGreaterThanOrEqual(20);
  });
});
