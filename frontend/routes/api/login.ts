import { setCookie } from "jsr:@std/http/cookie";
import {
  define,
  createJsonResponse,
  emailRegex,
  passwordRegex,
  isSecureReq,
} from "../../utils.ts";
import { MESSAGES } from "../login.tsx";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const form = await ctx.req.formData();
      const email = form.get("email")?.toString()?.trim() || "";
      const password = form.get("password")?.toString() || "";
      const mode = form.get("mode")?.toString() || "login";

      // Extract telegram fields for both modes
      const telegramId = form.get("telegram_id")?.toString() || "";
      const telegramUsername = form.get("username")?.toString() || "";
      const isComingFromTelegram =
        Boolean(telegramId) && Boolean(telegramUsername);

      // Validate required fields
      if (!email || !password) {
        return createJsonResponse(MESSAGES.MISSING_FIELDS, 400);
      }

      // Validate email format
      if (!emailRegex.test(email)) {
        return createJsonResponse(MESSAGES.INVALID_EMAIL, 400);
      }

      // Validate password strength
      if (!passwordRegex.test(password)) {
        return createJsonResponse(MESSAGES.INVALID_PASSWORD, 400);
      }

      // Call auth-service for authentication
      const authServiceUrl = "http://auth-service:8000";

      try {
        if (mode === "register") {
          const metadata: Record<string, string> = {};
          if (isComingFromTelegram) {
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
              response.status
            );
          }

          // After successful registration, notify Telegram bot if session is available
          if (!result.needsEmailConfirmation && isComingFromTelegram) {
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
                    telegram_username: telegramUsername,
                    supabaseUserId: result.user.id,
                    refresh_token: result.session?.refresh_token,
                    access_token: result.session?.access_token,
                  }),
                }
              );
              if (!botResponse.ok) {
                console.error(
                  "Failed to notify Telegram bot:",
                  await botResponse.text()
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
            }
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
              response.status
            );
          }

          // After successful login, notify Telegram bot if coming from Telegram
          if (isComingFromTelegram) {
            try {
              const botResponse = await fetch(
                "http://telegram-bot:8001/user-logged-in",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    telegramId,
                    telegram_username: telegramUsername,
                    supabaseUserId: result.user.id,
                    refresh_token: result.refresh_token,
                    access_token: result.access_token,
                  }),
                }
              );
              if (!botResponse.ok) {
                console.error(
                  "Failed to notify Telegram bot:",
                  await botResponse.text()
                );
              }
            } catch (botError) {
              console.error("Error notifying Telegram bot:", botError);
            }
          }

          const { access_token, refresh_token } = result;
          const accessTtlSec = 15 * 60;
          const refreshTtlSec = 30 * 24 * 60 * 60;

          const headers = new Headers();
          const secure = isSecureReq(ctx.req);

          setCookie(headers, {
            name: "access_token",
            value: access_token,
            path: "/",
            httpOnly: true,
            sameSite: "Lax",
            secure,
            maxAge: accessTtlSec,
          });
          setCookie(headers, {
            name: "refresh_token",
            value: refresh_token,
            path: "/",
            httpOnly: true,
            sameSite: "Strict",
            secure,
            maxAge: refreshTtlSec,
          });

          headers.set("Location", "/dashboard");
          return new Response(null, { status: 303, headers });
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
});
