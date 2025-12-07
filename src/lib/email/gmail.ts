import { google } from "googleapis";

const gmailClientId = process.env.GOOGLE_CLIENT_ID;
const gmailClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const gmailRedirectUri = process.env.GOOGLE_REDIRECT_URI;
const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;
const gmailSenderEmail = process.env.GMAIL_SENDER_EMAIL;

// Helper to get OAuth client - doesn't require refresh token immediately
export function getOAuthClient() {
  if (!gmailClientId || !gmailClientSecret || !gmailRedirectUri) {
    throw new Error("Google OAuth is not configured. Missing Client ID, Secret, or Redirect URI.");
  }
  return new google.auth.OAuth2(gmailClientId, gmailClientSecret, gmailRedirectUri);
}

export function generateAuthUrl() {
  const oAuth2Client = getOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent", // Force refresh token generation
  });
}

export async function getTokensFromCode(code: string) {
  const oAuth2Client = getOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

function getGmailClient(userRefreshToken?: string | null) {
  const oAuth2Client = getOAuthClient();

  const token = userRefreshToken || gmailRefreshToken;

  if (!token) {
    throw new Error("No Gmail refresh token available (System or User).");
  }

  oAuth2Client.setCredentials({
    refresh_token: token,
  });

  // If using system token, use system sender email. 
  // If using user token, we ideally fetch their email profile, but here we might just rely on "me" alias
  // or let the caller specify.
  const sender = userRefreshToken ? "me" : gmailSenderEmail;

  if (!sender && !userRefreshToken) {
    throw new Error("GMAIL_SENDER_EMAIL is not set.");
  }

  return {
    oAuth2Client,
    sender: sender || "me", // 'me' works for authenticated user
  };
}

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
  refreshToken?: string | null;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
};

export async function sendGmailEmail({ to, subject, html, fromName, replyTo, refreshToken, attachments }: SendEmailParams) {
  const { oAuth2Client, sender } = getGmailClient(refreshToken);

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // If sending as 'me' (user token), we should fetch the profile to get the email address for 'From' header
  // or just let Gmail set it. 
  // But to support custom alias/name properly:
  let finalSender = sender;
  if (sender === "me") {
    // Optional: fetch profile to get email address
    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      finalSender = profile.data.emailAddress || "me";
    } catch (e) {
      console.warn("Failed to fetch user profile, using 'me'", e);
    }
  }

  const fromHeader = fromName ? `"${fromName}" <${finalSender}>` : finalSender;
  const replyToHeader = replyTo ? `Reply-To: ${replyTo}` : "";

  // Build MIME message with attachments if provided
  let messageParts: string[] = [];
  
  if (attachments && attachments.length > 0) {
    // Multipart message with attachments
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    messageParts = [
      `From: ${fromHeader}`,
      `To: ${to}`,
      replyToHeader,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      html,
    ].filter(Boolean);

    // Add attachments
    for (const attachment of attachments) {
      const contentType = attachment.contentType || "application/pdf";
      const base64Content = attachment.content.toString("base64");
      
      messageParts.push(
        `--${boundary}`,
        `Content-Type: ${contentType}; name="${attachment.filename}"`,
        "Content-Disposition: attachment; filename=\"" + attachment.filename + "\"",
        "Content-Transfer-Encoding: base64",
        "",
        base64Content
      );
    }

    messageParts.push(`--${boundary}--`);
  } else {
    // Simple HTML message without attachments
    messageParts = [
      `From: ${fromHeader}`,
      `To: ${to}`,
      replyToHeader,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      html,
    ].filter(Boolean);
  }

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



