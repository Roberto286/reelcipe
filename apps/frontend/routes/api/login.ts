import { setCookie } from "jsr:@std/http/cookie";
import {
  createJsonResponse,
  define,
  emailRegex,
  isSecureReq,
  passwordRegex,
} from "../../utils.ts";
import { MESSAGES } from "../login.tsx";

const BACKEND_URL = "http://backend:8000";

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

      try {
        if (mode === "signup") {
          // Signup via Better Auth backend
          const response = await fetch(
            `${BACKEND_URL}/api/auth/sign-up/email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email,
                password,
                name: telegramUsername || email.split("@")[0],
              }),
            }
          );

          const result = await response.json();

          if (!response.ok) {
            return createJsonResponse(
              result.message || "Registration failed",
              response.status
            );
          }

          // Get session cookie from response
          const setCookieHeader = response.headers.get("set-cookie");

          // After successful registration, notify Telegram bot if coming from Telegram
          if (isComingFromTelegram && result.user) {
            try {
              await fetch("http://telegram-bot:8001/user-registered", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  telegramId,
                  telegram_username: telegramUsername,
                  userId: result.user.id,
                }),
              });
            } catch (botError) {
              console.error("Error notifying Telegram bot:", botError);
            }
          }

          // Set session cookie and redirect
          const headers = new Headers();
          if (setCookieHeader) {
            headers.set("Set-Cookie", setCookieHeader);
          }
          headers.set("Location", "/recipes");
          return new Response(null, { status: 303, headers });
        } else {
          // Login via Better Auth backend
          const response = await fetch(
            `${BACKEND_URL}/api/auth/sign-in/email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email,
                password,
              }),
            }
          );

          const result = await response.json();
          console.log("result :>> ", result);

          if (!response.ok) {
            return createJsonResponse(
              result.message || "Login failed",
              response.status
            );
          }

          // Get session cookie from response
          const setCookieHeader = response.headers.get("set-cookie");

          // After successful login, notify Telegram bot if coming from Telegram
          if (isComingFromTelegram && result.user) {
            try {
              await fetch("http://telegram-bot:8001/user-logged-in", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  telegramId,
                  telegram_username: telegramUsername,
                  userId: result.user.id,
                }),
              });
            } catch (botError) {
              console.error("Error notifying Telegram bot:", botError);
            }
          }

          // Set session cookie and redirect
          const headers = new Headers();
          const secure = isSecureReq(ctx.req);

          if (setCookieHeader) {
            headers.set("Set-Cookie", setCookieHeader);
          }

          // Also set user_id cookie for frontend access
          if (result.user) {
            setCookie(headers, {
              name: "user_id",
              value: result.user.id,
              path: "/",
              httpOnly: false,
              sameSite: "Lax",
              secure,
              maxAge: 30 * 24 * 60 * 60, // 30 days
            });
          }

          headers.set("Location", "/recipes");
          return new Response(null, { status: 303, headers });
        }
      } catch (networkError) {
        console.error("Backend service error:", networkError);
        return createJsonResponse("Authentication service unavailable", 503);
      }
    } catch (error) {
      console.error("POST handler error:", error);
      return createJsonResponse(MESSAGES.SERVER_ERROR, 500);
    }
  },
});
