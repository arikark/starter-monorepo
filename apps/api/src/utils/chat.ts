import { type Redis } from "@upstash/redis";
import type OpenAI from "openai";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  userId: string;
  timestamp: number;
}

export interface ChatResponse {
  role: "assistant";
  content: string;
  sessionId: string;
}

export class ChatService {
  private openai: OpenAI;
  private redis: Redis;

  constructor(openai: OpenAI, redis: Redis) {
    this.openai = openai;
    this.redis = redis;
  }

  private getChatKey(userId: string, sessionId: string): string {
    return `chat:${userId}:${sessionId}`;
  }

  async sendMessage(
    messages: ChatMessage[],
    sessionId: string,
    userId: string,
  ): Promise<ChatResponse> {
    const chatKey = this.getChatKey(userId, sessionId);

    // Get existing chat history
    const chatHistory = (await this.redis.get<ChatMessage[]>(chatKey)) || [];

    // Add user ID and timestamp to new messages
    const messagesWithMetadata = messages.map((msg) => ({
      ...msg,
      userId,
      timestamp: Date.now(),
    }));

    // Combine existing history with new messages
    const allMessages = [
      ...chatHistory,
      ...messagesWithMetadata,
    ] satisfies ChatMessage[];

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: allMessages.map(({ role, content }) => ({ role, content })),
      temperature: 0.1,
      max_tokens: 1000,
    });

    const assistantResponse = completion.choices[0]?.message;

    // Add metadata to assistant response
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: assistantResponse?.content || "No response generated",
      userId,
      timestamp: Date.now(),
    };

    // Update chat history with new messages and response
    const updatedHistory = [
      ...allMessages,
      assistantMessage,
    ] satisfies ChatMessage[];
    await this.redis.set(chatKey, updatedHistory);

    return {
      role: "assistant",
      content: assistantMessage.content,
      sessionId,
    };
  }

  async getChatHistory(
    sessionId: string,
    userId: string,
  ): Promise<ChatMessage[]> {
    const chatKey = this.getChatKey(userId, sessionId);
    const chatHistory = await this.redis.get<ChatMessage[]>(chatKey);
    // Return an empty array if chat history is not found
    return chatHistory || [];
  }

  async clearChatHistory(sessionId: string, userId: string): Promise<void> {
    const chatKey = this.getChatKey(userId, sessionId);
    await this.redis.del(chatKey);
  }
}
