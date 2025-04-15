import { openai } from "@ai-sdk/openai";
import { type Redis } from "@upstash/redis";
import {
  appendClientMessage,
  appendResponseMessages,
  type Message,
  streamText,
  tool,
} from "ai";
import { z } from "zod";

import { searchGmailTool } from "../tools/gmail";

export class ChatService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  private getChatKey(userId: string, sessionId: string): string {
    return `chat:${userId}:${sessionId}`;
  }

  async sendMessage(message: Message, sessionId: string, userId: string) {
    const chatKey = this.getChatKey(userId, sessionId);

    // Get existing chat history
    const chatHistory = (await this.redis.get<Message[]>(chatKey)) || [];

    console.log("chatHistory", chatHistory);
    console.log("message", message);

    const allMessagesToDate = appendClientMessage({
      messages: chatHistory,
      message,
    });

    const model = openai("gpt-4o-mini");
    const result = streamText({
      model,
      messages: allMessagesToDate,
      temperature: 0.1,
      tools: {
        searchGmail: tool({
          description: "Search user's Gmail inbox",
          parameters: z.object({
            query: z.string(),
          }),
          execute: async ({ query }: { query: string }, options) => {
            return searchGmailTool.execute(
              {
                userId,
                query,
              },
              options,
            );
          },
        }),
      },
      maxSteps: 10,
      onFinish: async ({ response }) => {
        const messages = appendResponseMessages({
          messages: allMessagesToDate,
          responseMessages: response.messages,
        });
        await this.redis.set(chatKey, JSON.stringify([...messages], null, 2));
      },
    });
    // consume the stream to ensure it runs to completion & triggers onFinish
    // even when the client response is aborted:
    result.consumeStream();

    return result;
  }
}
