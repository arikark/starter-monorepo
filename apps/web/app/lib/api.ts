// API functions for chat operations
import { useAuth } from "@clerk/clerk-react";

// Define the chat message type
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Custom hook for API operations
export function useApi() {
  const { getToken } = useAuth();

  // Helper function to get headers with auth token
  const getHeaders = async (): Promise<HeadersInit> => {
    const token = await getToken();

    if (!token) {
      throw new Error("Authentication token not available");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Fetch chat history for a session
  const fetchChatHistory = async (
    sessionId: string,
  ): Promise<ChatMessage[]> => {
    try {
      const apiUrl = `${API_URL}/api/chat/${sessionId}`;
      const headers = await getHeaders();
      const response = await fetch(apiUrl, { headers });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Unexpected content type: ${contentType}`);
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error("Failed to load chat history:", error);
      throw error;
    }
  };

  // Send a message to the API
  const sendMessage = async (
    message: ChatMessage,
    sessionId: string,
  ): Promise<ChatMessage> => {
    try {
      const apiUrl = `${API_URL}/api/chat`;
      const headers = await getHeaders();
      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [message],
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Unexpected content type: ${contentType}`);
      }

      const data = await response.json();
      return {
        role: "assistant",
        content: data.content,
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  // Clear chat history for a session
  const clearChatHistory = async (sessionId: string): Promise<void> => {
    try {
      const apiUrl = `${API_URL}/api/chat/${sessionId}`;
      const headers = await getHeaders();
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to clear chat:", error);
      throw error;
    }
  };

  return {
    fetchChatHistory,
    sendMessage,
    clearChatHistory,
  };
}
