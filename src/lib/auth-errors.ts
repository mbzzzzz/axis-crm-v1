"use client";

export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
  helpText?: string;
}

export function getAuthError(error: any): AuthError {
  const errorMessage = error?.message || String(error);
  const errorCode = error?.code || error?.status || "UNKNOWN_ERROR";

  // Supabase auth errors
  if (errorMessage.includes("Invalid login credentials")) {
    return {
      code: "INVALID_CREDENTIALS",
      message: errorMessage,
      userMessage: "Invalid email or password. Please check your credentials and try again.",
      helpText: "Make sure you're using the correct email and password. If you've forgotten your password, you can reset it.",
    };
  }

  if (errorMessage.includes("Email not confirmed")) {
    return {
      code: "EMAIL_NOT_CONFIRMED",
      message: errorMessage,
      userMessage: "Please verify your email address before signing in.",
      helpText: "Check your inbox for a verification email. If you didn't receive it, check your spam folder or request a new one.",
    };
  }

  if (errorMessage.includes("User already registered")) {
    return {
      code: "USER_EXISTS",
      message: errorMessage,
      userMessage: "An account with this email already exists.",
      helpText: "Try signing in instead, or use a different email address.",
    };
  }

  if (errorMessage.includes("Password")) {
    return {
      code: "PASSWORD_ERROR",
      message: errorMessage,
      userMessage: "There was an issue with your password.",
      helpText: "Make sure your password meets the requirements (at least 6 characters).",
    };
  }

  if (errorMessage.includes("session") || errorMessage.includes("expired")) {
    return {
      code: "SESSION_EXPIRED",
      message: errorMessage,
      userMessage: "Your session has expired. Please sign in again.",
      helpText: "For security, sessions expire after a period of inactivity. Sign in again to continue.",
    };
  }

  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: errorMessage,
      userMessage: "Network error. Please check your internet connection.",
      helpText: "Make sure you're connected to the internet and try again.",
    };
  }

  if (errorCode === 429 || errorMessage.includes("rate limit")) {
    return {
      code: "RATE_LIMIT",
      message: errorMessage,
      userMessage: "Too many attempts. Please wait a moment and try again.",
      helpText: "For security, we limit the number of login attempts. Please wait a few minutes before trying again.",
    };
  }

  // Generic error
  return {
    code: errorCode,
    message: errorMessage,
    userMessage: "An error occurred. Please try again.",
    helpText: "If this problem persists, please contact support.",
  };
}

export function formatAuthError(error: any): string {
  const authError = getAuthError(error);
  return authError.userMessage;
}

