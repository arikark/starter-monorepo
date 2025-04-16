import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { google } from "googleapis";
import z from "zod";

import { getAccessToken } from "../../../utils";
import { getGoogleClient } from "../utils";

export class PeopleService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getPeople({ query }: { query?: string }) {
    try {
      // fetch subject of most recent email
      const googleAuth = await getGoogleClient({
        access_token: await getAccessToken(this.userId),
        scopes: ["https://www.googleapis.com/auth/contacts.readonly"],
      });
      const peopleClient = google.people({
        version: "v1",
        auth: googleAuth,
      });

      // Run contact searches in parallel
      const [contacts, otherContacts] = await Promise.all([
        peopleClient.people.searchContacts({
          readMask: "phoneNumbers,emailAddresses,names,metadata",
          pageSize: 20,
          query: query,
        }),
        peopleClient.otherContacts.search({
          readMask: "phoneNumbers,emailAddresses,names,metadata",
          pageSize: 20,
          query: query,
        }),
      ]);

      const formattedContacts =
        (contacts.data.results &&
          contacts.data.results.map((contact) => ({
            name: contact.person?.names?.[0]?.displayName,
            email: contact.person?.emailAddresses?.[0]?.value,
            phone: contact.person?.phoneNumbers?.[0]?.value,
          }))) ||
        [];

      const formattedOtherContacts =
        (otherContacts.data.results &&
          otherContacts.data.results.map((contact) => ({
            name: contact.person?.names?.[0]?.displayName,
            email: contact.person?.emailAddresses?.[0]?.value,
            phone: contact.person?.phoneNumbers?.[0]?.value,
          }))) ||
        [];

      const combinedContacts = [
        ...formattedContacts,
        ...formattedOtherContacts,
      ];

      return {
        contacts: combinedContacts,
      };
    } catch (error) {
      console.error("Error fetching Gmail messages:", error);
      return "Error fetching email subject";
    }
  }
}
