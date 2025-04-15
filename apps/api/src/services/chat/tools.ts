import { type ChatCompletionTool } from "openai/resources/chat/completions";

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_gmail_messages",
      description:
        "Get the subject of the most recent email from your Gmail inbox",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Optional search query to filter emails (e.g. 'from:example@gmail.com')",
          },
        },
      },
    },
  },
];
