import { type Redis } from "@upstash/redis";
import type OpenAI from "openai";

import { type GmailService } from "../gmail/gmail";
import { tools } from "./tools";
export interface BaseMessage {
  content: string;
  userId: string;
  timestamp: number;
}

export interface UserMessage extends BaseMessage {
  role: "user";
}

export interface AssistantMessage extends BaseMessage {
  role: "assistant";
}

export interface SystemMessage extends BaseMessage {
  role: "system";
}

export interface ToolMessage extends BaseMessage {
  role: "tool";
  tool_call_id: string;
}

export type ChatMessage =
  | UserMessage
  | AssistantMessage
  | SystemMessage
  | ToolMessage;

export interface ChatResponse {
  role: "assistant";
  content: string;
  sessionId: string;
}

export class ChatService {
  private openai: OpenAI;
  private redis: Redis;
  private gmailService: GmailService;

  constructor(openai: OpenAI, redis: Redis, gmailService: GmailService) {
    this.openai = openai;
    this.redis = redis;
    this.gmailService = gmailService;
  }

  private getChatKey(userId: string, sessionId: string): string {
    return `chat:${userId}:${sessionId}`;
  }

  private mapMessageToOpenAI(msg: ChatMessage) {
    if (msg.role === "tool") {
      return {
        role: "tool" as const,
        content: msg.content,
        tool_call_id: msg.tool_call_id,
      };
    }
    return {
      role: msg.role,
      content: msg.content,
    };
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
      model: "gpt-4",
      messages: allMessages.map(this.mapMessageToOpenAI),
      temperature: 0.1,
      max_tokens: 1000,
      tools,
      tool_choice: "auto",
    });

    const assistantResponse = completion.choices[0]?.message;

    // Handle tool calls if present
    if (assistantResponse?.tool_calls) {
      // Add the assistant's message with tool calls first
      const assistantMessageWithTools: AssistantMessage = {
        role: "assistant",
        content: assistantResponse.content || "",
        userId,
        timestamp: Date.now(),
      };
      allMessages.push(assistantMessageWithTools);

      // Then add tool responses
      for (const toolCall of assistantResponse.tool_calls) {
        if (toolCall.function.name === "get_gmail_messages") {
          const args = JSON.parse(toolCall.function.arguments);
          console.log("calling gmail service");
          const subject = await this.gmailService.getGmailMessages({
            accessToken: this.gmailService.getAccessToken(),
            query: args.query,
          });

          // Add the tool response to messages
          const toolMessage: ToolMessage = {
            role: "tool",
            content: subject,
            userId,
            timestamp: Date.now(),
            tool_call_id: toolCall.id,
          };
          allMessages.push(toolMessage);
        }
      }

      // Get a new completion with the tool responses
      const finalCompletion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: allMessages.map(this.mapMessageToOpenAI),
        temperature: 0.1,
        max_tokens: 1000,
      });

      // Add the final assistant response
      const finalAssistantMessage: AssistantMessage = {
        role: "assistant",
        content:
          finalCompletion.choices[0]?.message?.content ||
          "No response generated",
        userId,
        timestamp: Date.now(),
      };
      allMessages.push(finalAssistantMessage);
    } else {
      // If no tool calls, just add the assistant's message
      const assistantMessage: AssistantMessage = {
        role: "assistant",
        content: assistantResponse?.content || "No response generated",
        userId,
        timestamp: Date.now(),
      };
      allMessages.push(assistantMessage);
    }

    // Update chat history with new messages and response
    const updatedHistory = [...allMessages] satisfies ChatMessage[];
    await this.redis.set(chatKey, updatedHistory);

    return {
      role: "assistant",
      content:
        allMessages[allMessages.length - 1]?.content || "No response generated",
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
