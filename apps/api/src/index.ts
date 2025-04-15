import { createClerkClient, verifyToken } from "@clerk/backend";
import { serve } from "@hono/node-server";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
import { Hono } from "hono";
import { type Context } from "hono";
import { cors } from "hono/cors";
import { stream } from "hono/streaming";

import { ChatService } from "./agents/chat";

dotenv.config();

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is required");
}

// Initialize Clerk client with secret key
export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Define our custom context type
type AppContext = {
  Variables: {
    userId: string;
  };
};

const app = new Hono<AppContext>();

// Enable CORS
app.use("/*", cors());

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Initialize chat service
const chatService = new ChatService(redis);

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
    const { message, sessionId } = await c.req.json();
    const userId = c.get("userId");

    if (!message) {
      return c.json({ error: "Invalid request format" }, 400);
    }

    const result = await chatService.sendMessage(message, sessionId, userId);
    // Mark the response as a v1 data stream:
    c.header("X-Vercel-AI-Data-Stream", "v1");
    c.header("Content-Type", "text/plain; charset=utf-8");

    return stream(c, (stream) => stream.pipe(result.toDataStream()));
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
