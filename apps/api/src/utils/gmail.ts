import { google } from "googleapis";

export class GmailService {
  private accessToken: string;

  constructor({ accessToken }: { accessToken: string }) {
    this.accessToken = accessToken;
  }

  private async getGoogleClient({
    accessToken,
    scopes,
  }: {
    accessToken: string;
    scopes: string[];
  }) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const googleAuth = new google.auth.OAuth2({
      clientId,
      clientSecret,
    });
    googleAuth.setCredentials({
      scope: scopes.join(" "),
      access_token: accessToken,
    });

    return googleAuth;
  }

  private async getGmailClient({ accessToken }: { accessToken: string }) {
    const googleAuth = await this.getGoogleClient({
      accessToken,
      scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    });
    return google.gmail({
      version: "v1",
      auth: googleAuth,
    });
  }

  async getGmailMessages({
    accessToken,
    query,
  }: {
    accessToken: string;
    query: string;
  }) {
    try {
      // fetch subject of most recent email
      const gmailClient = await this.getGmailClient({
        accessToken,
      });

      const response = await gmailClient.users.messages.list({
        userId: "me",
        q: query,
      });

      const messages = response.data.messages;
      if (!messages || messages.length === 0) {
        return "No messages found";
      }

      const firstMessage = messages[0];
      if (!firstMessage || !firstMessage.id) {
        return "Message ID not found";
      }

      const messageDetails = await gmailClient.users.messages.get({
        userId: "me",
        id: firstMessage.id,
      });

      // Extract subject from headers
      const headers = messageDetails.data.payload?.headers || [];
      console.log(headers);
      let subject = "No subject";

      // Find subject header
      for (const header of headers) {
        if (header.name === "Subject" && header.value) {
          subject = header.value;
          break;
        }
      }

      return subject;
    } catch (error) {
      console.error("Error fetching Gmail messages:", error);
      return "Error fetching email subject";
    }
  }
}
