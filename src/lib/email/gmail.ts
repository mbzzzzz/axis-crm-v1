import { google } from "googleapis";

const gmailClientId = process.env.GOOGLE_CLIENT_ID;
const gmailClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const gmailRedirectUri = process.env.GOOGLE_REDIRECT_URI;
const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;
const gmailSenderEmail = process.env.GMAIL_SENDER_EMAIL;

function getGmailClient() {
  if (!gmailClientId || !gmailClientSecret || !gmailRedirectUri || !gmailRefreshToken || !gmailSenderEmail) {
    throw new Error(
      "Gmail is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GMAIL_REFRESH_TOKEN, and GMAIL_SENDER_EMAIL."
    );
  }

  const oAuth2Client = new google.auth.OAuth2(
    gmailClientId,
    gmailClientSecret,
    gmailRedirectUri
  );

  oAuth2Client.setCredentials({
    refresh_token: gmailRefreshToken,
  });

  return {
    oAuth2Client,
    sender: gmailSenderEmail,
  };
}

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendGmailEmail({ to, subject, html }: SendEmailParams) {
  const { oAuth2Client, sender } = getGmailClient();

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const messageParts = [
    `From: ${sender}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ];

  const message = messageParts.join("\r\n");
  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });
}



