import { type Auth, google } from "googleapis";

export const getGoogleClient = async ({
  scopes,
  access_token,
}: {
  scopes: string[];
  access_token: string;
}): Promise<Auth.OAuth2Client> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleAuth = new google.auth.OAuth2({
    clientId,
    clientSecret,
  });
  googleAuth.setCredentials({
    scope: scopes.join(" "),
    access_token,
  });
  return googleAuth;
};
