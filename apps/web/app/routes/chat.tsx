import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
// Import TanStack Query - this will be installed later
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { ArrowLeft, Bot, Send, Trash2, User } from "lucide-react";

import { GmailForm } from "../components/GmailForm";
import { type ChatMessage, useApi } from "../lib/api";

// Loader function to get session ID
export function loader() {
  // Generate a session ID if not already set
  const sessionId = Date.now().toString();
  return { sessionId };
}

export default function Chat() {
  const { sessionId } = useLoaderData<typeof loader>();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const api = useApi();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch chat history using TanStack Query
  const { data: messages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["chatHistory", sessionId],
    queryFn: () => api.fetchChatHistory(sessionId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: ChatMessage) => api.sendMessage(message, sessionId),
    onSuccess: (_data: ChatMessage) => {
      // Invalidate and refetch chat history
      queryClient.invalidateQueries({ queryKey: ["chatHistory", sessionId] });
    },
    onError: (error: unknown) => {
      console.error("Error sending message:", error);
      setError(
        `Error sending message: ${error instanceof Error ? error.message : String(error)}`,
      );
    },
  });

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: () => api.clearChatHistory(sessionId),
    onSuccess: () => {
      // Invalidate and refetch chat history
      queryClient.invalidateQueries({ queryKey: ["chatHistory", sessionId] });
    },
    onError: (error: unknown) => {
      console.error("Failed to clear chat:", error);
      setError(
        `Failed to clear chat: ${error instanceof Error ? error.message : String(error)}`,
      );
    },
  });

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    // Add user message to the chat immediately
    setInput("");
    setIsLoading(true);
    setError(null);

    // Optimistically update the UI with the user's message
    queryClient.setQueryData(
      ["chatHistory", sessionId],
      (oldData: ChatMessage[] = []) => {
        return [...oldData, userMessage];
      },
    );

    try {
      // Send message using mutation
      await sendMessageMutation.mutateAsync(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      setError(null);
      await clearChatMutation.mutateAsync();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Chat</h1>

          <GmailForm />

          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">
                Chat Interface
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleClearChat}
                  title="Clear Chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("/")}
                  title="Back to Home"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {error && (
              <div className="mx-4 mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[calc(100vh-220px)] p-4">
                <div className="flex flex-col gap-4">
                  {messages.length === 0 && !isLoading && !isLoadingHistory && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <Bot className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">No messages yet</p>
                      <p className="text-sm">
                        Start a conversation by typing a message below
                      </p>
                    </div>
                  )}

                  {messages.map((message: ChatMessage, index: number) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/bot-avatar.svg" alt="Assistant" />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>

                      {message.role === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/user-avatar.svg" alt="User" />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {(isLoading || isLoadingHistory) && (
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/bot-avatar.svg" alt="Assistant" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <div className="flex w-full gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
