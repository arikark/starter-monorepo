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
    return googleAuth;
  }

  async getGmailMessages({ query }: { query?: string }) {
    try {
      // fetch subject of most recent email
      const googleAuth = await this.getGoogleClient({
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      });
      const gmailClient = google.gmail({
        version: "v1",
        auth: googleAuth,
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
