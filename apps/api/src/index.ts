import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { Hono } from "hono";
import { type Context } from "hono";
import { cors } from "hono/cors";
import { stream } from "hono/streaming";

import { ChatService } from "./agents/chat";
import { PeopleService } from "./tools/google/people/service";
import { clerk, redis } from "./utils";

dotenv.config();

// Define our custom context type
type AppContext = {
  Variables: {
    token: string;
  };
};

const app = new Hono<AppContext>();

// Enable CORS
app.use("/*", cors());

// Initialize chat service
const chatService = new ChatService(redis);

app.use("/*", clerkMiddleware());

// Auth middleware
const verifyAuth = async (
  c: Context<AppContext>,
  next: () => Promise<void>,
) => {
  try {
    // Extract token from Authorization header
    const { isSignedIn, token } = await clerk.authenticateRequest(c.req.raw);

    if (!isSignedIn) {
      return c.json({ error: "Unauthorized: Missing token" }, 401);
    }

    // Set the verified token in the context
    c.set("token", token);

    await next();
  } catch (error) {
    console.error("Auth error:", error);
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
};

// Chat endpoint
app.post("/api/chat", verifyAuth, async (c) => {
  try {
    const { message, id } = await c.req.json();
    const auth = getAuth(c);
    const userId = auth?.userId;

    if (!message || !userId) {
      return c.json({ error: "Invalid request format" }, 400);
    }

    const result = await chatService.sendMessage(message, id, userId);
    // Mark the response as a v1 data stream:
    c.header("X-Vercel-AI-Data-Stream", "v1");
    c.header("Content-Type", "text/plain; charset=utf-8");

    return stream(c, (stream) => stream.pipe(result.toDataStream()));
  } catch (error) {
    console.error("Error processing chat request:", error);
    return c.json({ error: "Failed to process request" }, 500);
  }
});

app.get("/api/people", verifyAuth, async (c) => {
  try {
    const auth = getAuth(c);
    const query = c.req.query("query");
    const userId = auth?.userId;

    if (!userId) {
      return c.json({ error: "PeopleService: Missing userId" }, 401);
    }

    const peopleService = new PeopleService(userId);
    const result = await peopleService.getPeople({
      query: query || "",
    });
    return c.json(result);
  } catch (error) {
    console.error("Error processing people request:", error);
    return c.json({ error: "Failed to process request" }, 500);
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
