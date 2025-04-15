import { tool } from "ai";
import z from "zod";

import { clerk } from "../..";
import { GmailService } from "./service";

// const gmailResponseSchema = z.object({
//   from: z.string().describe("The sender of the email"),
//   to: z.string().describe("The recipient of the email"),
//   date: z.string().describe("The date of the email"),
//   subject: z.string().describe("The subject of the email"),
//   body: z.string().describe("The body of the email"),
//   attachments: z.array(
//     z.object({
//       filename: z.string().describe("The filename of the attachment"),
//       fileId: z.string().describe("The file ID of the attachment"),
//       fileType: z.string().describe("The type of the attachment"),
//       partNumber: z.number().describe("The part number of the attachment"),
//       size: z.number().describe("The size of the attachment"),
//     }),
//   ),
// });

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
