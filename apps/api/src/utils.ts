import { createClerkClient } from "@clerk/backend";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

// Initialize Clerk client with secret key
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is required");
}
if (!process.env.CLERK_PUBLISHABLE_KEY) {
  throw new Error("CLERK_PUBLISHABLE_KEY is required");
}
export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

export const getAccessToken = async (userId: string) => {
  const {
    data: [OauthAccessToken],
  } = await clerk.users.getUserOauthAccessToken(userId, "google");
  if (!OauthAccessToken?.token) {
    throw new Error("No access token found");
  }
  return OauthAccessToken.token;
};

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});
