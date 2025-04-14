// API functions for chat operations

// Define the chat message type
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Fetch chat history for a session
export async function fetchChatHistory(
  sessionId: string,
): Promise<ChatMessage[]> {
  try {
    const apiUrl = `${API_URL}/api/chat/${sessionId}`;
    const response = await fetch(apiUrl);

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
}

// Send a message to the API
export async function sendMessage(
  message: ChatMessage,
  sessionId: string,
): Promise<ChatMessage> {
  try {
    const apiUrl = `${API_URL}/api/chat`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
}

// Clear chat history for a session
export async function clearChatHistory(sessionId: string): Promise<void> {
  try {
    const apiUrl = `${API_URL}/api/chat/${sessionId}`;
    const response = await fetch(apiUrl, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to clear chat:", error);
    throw error;
  }
}
