import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useUser } from "@clerk/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Combobox } from "@workspace/ui/components/combobox";
import { Input } from "@workspace/ui/components/input";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Bot, Send, Trash2, User } from "lucide-react";

import { API_URL, useApi } from "../lib/api";

export function Chat() {
  const { getHeaders, getPeople } = useApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [contactsQueryOne, setContactsQueryOne] = useState("");
  const [contactsQueryTwo, setContactsQueryTwo] = useState("");

  const { data: contactsDataOne } = useQuery({
    queryKey: ["people", contactsQueryOne],
    queryFn: () => getPeople(contactsQueryOne),
    select: (data) => {
      const emailIcon = "📧";
      const phoneIcon = "📞";

      return data.contacts?.map(({ name, email, phone }) => {
        let label = `${name}`;
        if (!email && !phone) {
          return null;
        }
        if (email && phone) {
          label += ` ${emailIcon} ${phoneIcon}`;
        } else if (email) {
          label += ` ${emailIcon}`;
        } else if (phone) {
          label += ` ${phoneIcon}`;
        }
        const labelComponent = (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{label}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{name}</p>
              <p>{email}</p>
              <p>{phone}</p>
            </TooltipContent>
          </Tooltip>
        );
        return {
          value: JSON.stringify({ name, email, phone }),
          label: labelComponent,
        };
      });
    },
  });

  const { data: contactsDataTwo } = useQuery({
    queryKey: ["people", contactsQueryTwo],
    queryFn: () => getPeople(contactsQueryTwo),
    select: (data) => {
      return data.contacts?.map(({ name, email, phone }) => ({
        value: JSON.stringify({ name, email, phone }),
        label: `${name} (${email ?? phone})`,
      }));
    },
  });

  console.log("contactsDataOne", contactsDataOne);
  console.log("contactsDataTwo", contactsDataTwo);

  const {
    messages,
    handleInputChange,
    input,
    handleSubmit,
    setMessages,
    reload,
    status,
  } = useChat({
    api: `${API_URL}/api/chat`,
    headers,
    experimental_prepareRequestBody: ({ messages, id }) => ({
      message: messages[messages.length - 1],
      id,
    }),
  });

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const headers = await getHeaders();
    setHeaders(headers);
    handleSubmit(e);
  };

  const handleClearChat = () => {
    setMessages([]);
    reload();
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col h-full max-h-screen p-4 mt-auto">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex gap-2">
            <Combobox
              placeholder="Select person a"
              options={contactsDataOne ?? []}
              onSearch={setContactsQueryOne}
            />
            <Combobox
              placeholder="Select person b"
              options={contactsDataTwo ?? []}
              onSearch={setContactsQueryTwo}
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleClearChat}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear chat
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Bot className="h-12 w-12 mb-4" />
                  <p className="text-lg">Start a conversation</p>
                  <p className="text-sm">Ask me anything!</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[80%] ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      } items-start gap-2`}
                    >
                      <Avatar className="h-8 w-8">
                        {message.role === "user" ? (
                          <>
                            <AvatarImage src={user?.imageUrl} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </>
                        ) : (
                          <>
                            <AvatarImage />
                            <AvatarFallback>
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
