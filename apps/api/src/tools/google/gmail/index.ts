import { tool } from "ai";
import z from "zod";

import { clerk } from "../../../utils";
import { GmailService } from "./service";

const searchGmail = async ({
  userId,
  query,
}: {
  userId: string;
  query: string;
}) => {
  const {
    data: [OauthAccessToken],
  } = await clerk.users.getUserOauthAccessToken(userId || "", "google");
  if (!OauthAccessToken?.token) {
    throw new Error("No access token found");
  }
  const gmailClient = new GmailService({
    accessToken: OauthAccessToken.token,
  });
  const messages = await gmailClient.getGmailMessageSnippets({
    query,
  });
  console.log("messages", messages);
  return messages;
};

export const searchGmailTool = tool({
  description: "Search user's Gmail inbox",
  parameters: z.object({
    userId: z.string(),
    query: z.string(),
  }),
  execute: searchGmail,
});
