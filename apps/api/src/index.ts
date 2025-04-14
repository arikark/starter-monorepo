import { serve } from "@hono/node-server";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";

import { ChatService } from "./utils/chat";

dotenv.config();

const app = new Hono();

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

// Chat endpoint
app.post("/api/chat", async (c) => {
  try {
    const { messages, sessionId } = await c.req.json();

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "Invalid request format" }, 400);
    }

    const response = await chatService.sendMessage(messages, sessionId);
    return c.json(response);
  } catch (error) {
    console.error("Error processing chat request:", error);
    return c.json({ error: "Failed to process request" }, 500);
  }
});

// Get chat history endpoint
app.get("/api/chat/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const history = await chatService.getChatHistory(sessionId);
    return c.json({ history });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return c.json({ error: "Failed to fetch chat history" }, 500);
  }
});

// Clear chat history endpoint
app.delete("/api/chat/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    await chatService.clearChatHistory(sessionId);
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
