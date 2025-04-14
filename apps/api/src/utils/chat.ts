import { type Redis } from "@upstash/redis";
import type OpenAI from "openai";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
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

  async sendMessage(
    messages: ChatMessage[],
    sessionId?: string,
  ): Promise<ChatResponse> {
    const currentSessionId = sessionId || Date.now().toString();

    // Get existing chat history
    const chatHistory =
      (await this.redis.get<ChatMessage[]>(`chat:${currentSessionId}`)) || [];

    // Combine existing history with new messages
    const allMessages = [...chatHistory, ...messages] as ChatMessage[];

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantResponse = completion.choices[0]?.message;

    // Update chat history with new messages and response
    const updatedHistory = [...allMessages, assistantResponse] as ChatMessage[];
    await this.redis.set(`chat:${currentSessionId}`, updatedHistory);

    return {
      role: "assistant",
      content: assistantResponse?.content || "No response generated",
      sessionId: currentSessionId,
    };
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const chatHistory = await this.redis.get<ChatMessage[]>(
      `chat:${sessionId}`,
    );
    // Return an empty array if chat history is not found
    return chatHistory || [];
  }

  async clearChatHistory(sessionId: string): Promise<void> {
    await this.redis.del(`chat:${sessionId}`);
  }
}
