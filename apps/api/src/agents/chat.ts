import { openai } from "@ai-sdk/openai";
import { type Redis } from "@upstash/redis";
import { type CoreMessage, generateText, tool } from "ai";
import { z } from "zod";

import { searchGmailTool } from "../tools/gmail";

export type EnrichedMessage = CoreMessage & {
  userId: string;
  timestamp: number;
};

export class ChatService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  private getChatKey(userId: string, sessionId: string): string {
    return `chat:${userId}:${sessionId}`;
  }

  async sendMessage(
    messages: CoreMessage[],
    sessionId: string,
    userId: string,
  ): Promise<CoreMessage[]> {
    const chatKey = this.getChatKey(userId, sessionId);

    // Get existing chat history
    const chatHistory =
      (await this.redis.get<EnrichedMessage[]>(chatKey)) || [];

    // Add user ID and timestamp to new messages
    const messagesWithMetadata = messages.map((msg) => ({
      ...msg,
      userId,
      timestamp: Date.now(),
    }));

    // Combine existing history with new messages
    const allMessages: EnrichedMessage[] = [
      ...chatHistory,
      ...messagesWithMetadata,
    ];

    const model = openai("gpt-4o-mini");
    const { steps, response } = await generateText({
      model,
      messages: allMessages,
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
    });

    if (response.messages.length > 0) {
      console.log(steps);
      console.log(response.messages);
      await this.redis.set(chatKey, allMessages);
    }

    return response.messages;
  }

  async getChatHistory(
    sessionId: string,
    userId: string,
  ): Promise<EnrichedMessage[]> {
    const chatKey = this.getChatKey(userId, sessionId);
    const chatHistory = await this.redis.get<EnrichedMessage[]>(chatKey);
    // Return an empty array if chat history is not found
    return chatHistory || [];
  }

  async clearChatHistory(sessionId: string, userId: string): Promise<void> {
    const chatKey = this.getChatKey(userId, sessionId);
    await this.redis.del(chatKey);
  }
}
