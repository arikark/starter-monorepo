import { google } from "googleapis";

export class GmailService {
  private accessToken: string;

  constructor({ accessToken }: { accessToken: string }) {
    this.accessToken = accessToken;
  }

  private async getGoogleClient({ scopes }: { scopes: string[] }) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const googleAuth = new google.auth.OAuth2({
      clientId,
      clientSecret,
    });
    googleAuth.setCredentials({
      scope: scopes.join(" "),
      access_token: this.accessToken,
    });
    console.log("googleAuth", await googleAuth.getTokenInfo(this.accessToken));
    return googleAuth;
  }

  async getGmailMessageSnippets({ query }: { query?: string }) {
    try {
      // fetch subject of most recent email
      const googleAuth = await this.getGoogleClient({
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      });
      const gmailClient = google.gmail({
        version: "v1",
        auth: googleAuth,
      });
      console.log(query);
      const response = await gmailClient.users.messages.list({
        maxResults: 10,
        userId: "me",
        q: query,
      });

      const messages = response.data.messages;
      if (!messages || messages.length === 0) {
        return "No messages found";
      }
      const messageDetails = [];
      for (const message of messages) {
        if (!message.id) continue;
        const messageDetail = await gmailClient.users.messages.get({
          id: message.id,
          userId: "me",
        });
        messageDetails.push(messageDetail);
      }

      const messageSnippets = messageDetails?.map(({ data }) => ({
        id: data?.id,
        snippet: data?.snippet,
      }));
      return messageSnippets;
    } catch (error) {
      console.error("Error fetching Gmail messages:", error);
      return "Error fetching email subject";
    }
  }
}
