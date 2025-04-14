import { createClerkClient, verifyToken } from "@clerk/backend";
import { serve } from "@hono/node-server";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
import { Hono } from "hono";
import { type Context } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";

import { ChatService } from "./utils/chat";
import { GmailService } from "./utils/gmail";

dotenv.config();

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is required");
}

// Initialize Clerk client with secret key
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Define our custom context type
type AppContext = {
  Variables: {
    userId: string;
  };
};

const app = new Hono<AppContext>();

// Enable CORS
app.use("/*", cors());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Initialize ChatService
const chatService = new ChatService(openai, redis);

// Auth middleware
const verifyAuth = async (
  c: Context<AppContext>,
  next: () => Promise<void>,
) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json({ error: "Unauthorized: Missing token" }, 401);
  }

  try {
    // Extract token from Authorization header
    const token = authHeader.replace("Bearer ", "");

    // Verify the JWT token with Clerk
    const decodedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    if (!decodedToken?.sub) {
      return c.json({ error: "Unauthorized: Invalid token" }, 401);
    }

    // Set the verified user ID in the context
    c.set("userId", decodedToken.sub);

    await next();
  } catch (error) {
    console.error("Auth error:", error);
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
};

// Chat endpoint
app.post("/api/chat", verifyAuth, async (c) => {
  try {
    const { messages, sessionId } = await c.req.json();
    const userId = c.get("userId");

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "Invalid request format" }, 400);
    }

    const response = await chatService.sendMessage(messages, sessionId, userId);
    return c.json(response);
  } catch (error) {
    console.error("Error processing chat request:", error);
    return c.json({ error: "Failed to process request" }, 500);
  }
});

// Get chat history endpoint
app.get("/api/chat/:sessionId", verifyAuth, async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const userId = c.get("userId");
    const history = await chatService.getChatHistory(sessionId, userId);
    return c.json({ history });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return c.json({ error: "Failed to fetch chat history" }, 500);
  }
});

// Clear chat history endpoint
app.delete("/api/chat/:sessionId", verifyAuth, async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const userId = c.get("userId");
    await chatService.clearChatHistory(sessionId, userId);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return c.json({ error: "Failed to clear chat history" }, 500);
  }
});

// Get Gmail messages endpoint
app.get("/api/gmail/messages", verifyAuth, async (c) => {
  try {
    const userId = c.get("userId");
    // this returns an array of OauthAccessToken objects I'm just getting the first one
    const {
      data: [OauthAccessToken],
    } = await clerk.users.getUserOauthAccessToken(userId || "", "google");

    console.log(OauthAccessToken);

    if (!OauthAccessToken) {
      return c.json({ error: "No access token found" }, 401);
    }

    const gmailService = new GmailService({
      accessToken: OauthAccessToken?.token,
    });

    const messages = await gmailService.getGmailMessages({
      accessToken: OauthAccessToken?.token,
      query: "from:me",
    });

    console.log(messages);

    return c.json({ messages });
  } catch (error) {
    console.error("Error fetching Gmail messages:", error);
    return c.json({ error: "Failed to fetch Gmail messages" }, 500);
  }
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

const port = process.env.PORT || 3001;

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
