import { google } from "googleapis";

export class GmailService {
  private access_token: string;
  private refresh_token: string;

  constructor({
    access_token,
    refresh_token,
  }: {
    access_token: string;
    refresh_token: string;
  }) {
    this.access_token = access_token;
    this.refresh_token = refresh_token;
  }

  private async getGoogleClient({
    accessToken,
    refreshToken,
    scopes,
  }: {
    accessToken: string;
    refreshToken: string;
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
      refresh_token: refreshToken,
    });

    return googleAuth;
  }

  private async getGmailClient({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken: string;
  }) {
    const googleAuth = await this.getGoogleClient({
      accessToken,
      refreshToken,
      scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    });
    return google.gmail({
      version: "v1",
      auth: googleAuth,
    });
  }

  async getGmailMessages({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken: string;
  }) {
    try {
      // fetch subject of most recent email
      const gmailClient = await this.getGmailClient({
        accessToken,
        refreshToken,
      });

      const response = await gmailClient.users.messages.list({
        userId: "me",
        q: "from:me",
      });

      console.log(response);

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
