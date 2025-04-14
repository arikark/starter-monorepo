import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@workspace/ui/components/button";

// Define the chat message type
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate a session ID if not already set
  useEffect(() => {
    if (!sessionId) {
      setSessionId(Date.now().toString());
    }
  }, [sessionId]);

  // Load chat history if session ID exists
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!sessionId) return;

      try {
        setError(null);
        console.log(`Fetching chat history for session: ${sessionId}`);

        // Use the full URL with the correct port for the API
        const apiUrl = "http://localhost:3001/api/chat/" + sessionId;
        console.log(`API URL: ${apiUrl}`);

        const response = await fetch(apiUrl);

        // Log the response status and headers for debugging
        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        // Check content type to ensure we're getting JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error(`Unexpected content type: ${contentType}`);
          throw new Error(`Unexpected content type: ${contentType}`);
        }

        const data = await response.json();
        console.log("Received data:", data);

        if (data.history && data.history.length > 0) {
          setMessages(data.history);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setError(`Failed to load chat history: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    loadChatHistory();
  }, [sessionId]);

  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    // Add user message to the chat
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Use the full URL with the correct port for the API
      const apiUrl = "http://localhost:3001/api/chat";
      console.log(`Sending message to: ${apiUrl}`);

      // Send message to the API
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [userMessage],
          sessionId,
        }),
      });

      // Log the response status and headers for debugging
      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`Unexpected content type: ${contentType}`);
        throw new Error(`Unexpected content type: ${contentType}`);
      }

      const data = await response.json();
      console.log("Received response:", data);

      // Add assistant response to the chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(`Error sending message: ${error instanceof Error ? error.message : String(error)}`);
      // Add error message to the chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!sessionId) return;

    try {
      setError(null);
      // Use the full URL with the correct port for the API
      const apiUrl = "http://localhost:3001/api/chat/" + sessionId;
      console.log(`Clearing chat at: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      setMessages([]);
    } catch (error) {
      console.error("Failed to clear chat:", error);
      setError(`Failed to clear chat: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Chat Interface</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClearChat}>
            Clear Chat
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 p-3 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type your message..."
          className="flex-1 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
        />
        <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}