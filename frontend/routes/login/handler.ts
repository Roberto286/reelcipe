import { Handlers, PageProps } from "$fresh/server.ts";
import { createJsonResponse } from "../../utils/http.ts";
import { emailRegex, passwordRegex } from "../../utils/regexes.ts";

import { Props } from "./types.ts";

// Response messages (can be internationalized later)
const MESSAGES = {
  INVALID_EMAIL: "Invalid email format",
  INVALID_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, digit, and special character",
  MISSING_FIELDS: "Email and password are required",
  LOGIN_SUCCESS: "Login successful",
  REGISTER_SUCCESS: "Registration successful",
  SERVER_ERROR: "Internal server error",
};

function validateEmail(email: string): boolean {
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return passwordRegex.test(password);
}

export const handler: Handlers<Props> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") === "register"
      ? "register"
      : "login";
    const telegramId = url.searchParams.get("telegram_id") || undefined;
    const telegramUsername = url.searchParams.get("username") || undefined;
    return ctx.render({ mode, telegramId, telegramUsername });
  },

  async POST(req) {
    try {
      const form = await req.formData();
      const email = form.get("email")?.toString()?.trim() || "";
      const password = form.get("password")?.toString() || "";
      const mode = form.get("mode")?.toString() || "login";

      // Validate required fields
      if (!email || !password) {
        return createJsonResponse(MESSAGES.MISSING_FIELDS, 400);
      }

      // Validate email format
      if (!validateEmail(email)) {
        return createJsonResponse(MESSAGES.INVALID_EMAIL, 400);
      }

      // Validate password strength
      if (!validatePassword(password)) {
        return createJsonResponse(MESSAGES.INVALID_PASSWORD, 400);
      }

      // Call auth-service for authentication
      const authServiceUrl = "http://auth-service:8000";

      try {
        if (mode === "register") {
          const telegramId = form.get("telegram_id")?.toString() || "";
          const telegramUsername = form.get("username")?.toString() || "";
          const metadata: Record<string, string> = {};
          if (telegramId && telegramUsername) {
            metadata.telegram_id = telegramId;
            metadata.username = telegramUsername;
          }

          // Register new user via auth-service
          const response = await fetch(`${authServiceUrl}/signup`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              ...(Object.keys(metadata)?.length ? { metadata } : {}),
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            return createJsonResponse(
              result.error || "Registration failed",
              response.status,
            );
          }

          // After successful registration, notify Telegram bot if session is available
          if (
            !result.needsEmailConfirmation && telegramId && telegramUsername
          ) {
            try {
              const botResponse = await fetch(
                "http://telegram-bot:8001/user-registered",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    telegramId,
                    username: telegramUsername,
                    supabaseUserId: result.user.id,
                    refresh_token: result.session?.refresh_token,
                  }),
                },
              );
              if (!botResponse.ok) {
                console.error(
                  "Failed to notify Telegram bot:",
                  await botResponse.text(),
                );
              }
            } catch (botError) {
              console.error("Error notifying Telegram bot:", botError);
            }
          }

          return createJsonResponse(
            result.message || MESSAGES.REGISTER_SUCCESS,
            response.status,
            {
              user: result.user,
              needsEmailConfirmation: result.needsEmailConfirmation,
            },
          );
        } else {
          // Login via auth-service
          const response = await fetch(`${authServiceUrl}/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          });
          const result = await response.json();
          if (response.status !== 200) {
            return createJsonResponse(
              result.error || "Login failed",
              response.status,
            );
          }

          return createJsonResponse(
            result.message || MESSAGES.LOGIN_SUCCESS,
            response.status,
            {
              user: result.user,
              access_token: result.access_token,
              refresh_token: result.refresh_token,
              expires_at: result.expires_at,
            },
          );
        }
      } catch (networkError) {
        console.error("Auth service error:", networkError);
        return createJsonResponse("Authentication service unavailable", 503);
      }
    } catch (error) {
      console.error("POST handler error:", error);
      return createJsonResponse(MESSAGES.SERVER_ERROR, 500);
    }
  },
};
