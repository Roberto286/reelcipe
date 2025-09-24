import { setCookie } from "jsr:@std/http/cookie";
import {
  appendQueryParams,
  createJsonResponse,
  define,
  emailRegex,
  isSecureReq,
  passwordRegex,
} from "../utils.ts";

const MESSAGES = {
  INVALID_EMAIL: "Invalid email format",
  INVALID_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, digit, and special character",
  MISSING_FIELDS: "Email and password are required",
  LOGIN_SUCCESS: "Login successful",
  REGISTER_SUCCESS: "Registration successful",
  SERVER_ERROR: "Internal server error",
};

const getRedirectUrl = (
  { mode, telegramId, telegramUsername }: Pick<
    ReturnType<typeof handler.GET>["data"],
    "mode" | "telegramId" | "telegramUsername"
  >,
) =>
  appendQueryParams("/login", {
    mode,
    telegram_id: telegramId,
    telegram_username: telegramUsername,
  });

export const handler = define.handlers({
  GET(ctx) {
    const url = new URL(ctx.req.url);

    const mode = url.searchParams.get("mode") === "register"
      ? "register"
      : "login";
    const telegramId = url.searchParams.get("telegram_id") || undefined;
    const telegramUsername = url.searchParams.get("telegram_username") ||
      undefined;
    return {
      data: { mode, telegramId, telegramUsername },
    };
  },
  async POST(ctx) {
    try {
      const form = await ctx.req.formData();
      const email = form.get("email")?.toString()?.trim() || "";
      const password = form.get("password")?.toString() || "";
      const mode = form.get("mode")?.toString() || "login";

      // Extract telegram fields for both modes
      const telegramId = form.get("telegram_id")?.toString() || "";
      const telegramUsername = form.get("username")?.toString() || "";
      const isComingFromTelegram = Boolean(telegramId) &&
        Boolean(telegramUsername);

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
              response.status,
            );
          }

          // After successful registration, notify Telegram bot if session is available
          if (
            !result.needsEmailConfirmation && isComingFromTelegram
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
                    telegram_username: telegramUsername,
                    supabaseUserId: result.user.id,
                    refresh_token: result.session?.refresh_token,
                    access_token: result.session?.access_token,
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

export default define.page<typeof handler>(function Login(props) {
  return (
    <div class="mx-auto max-w-sm">
      <div role="tablist" class="tabs tabs-lift justify-center">
        <a
          role="tab"
          class={`tab ${props.data.mode === "login" ? "tab-active" : ""}`}
          href={getRedirectUrl({ ...props.data, mode: "login" })}
        >
          Login
        </a>
        <a
          role="tab"
          class={`tab ${props.data.mode === "register" ? "tab-active" : ""}`}
          href={getRedirectUrl({ ...props.data, mode: "register" })}
        >
          Registrazione
        </a>
      </div>
      <div class="card bg-base-100 w-full shadow-2xl">
        <div class="card-body">
          <form action="/login" method="post" id="login-form" data-auto-disable>
            {props.data.telegramId && (
              <input
                type="hidden"
                name="telegram_id"
                value={props.data.telegramId}
              />
            )}
            {props.data.telegramUsername && (
              <input
                type="hidden"
                name="telegram_username"
                value={props.data.telegramUsername}
              />
            )}
            <input type="hidden" name="mode" value={props.data.mode} />
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {props.data.mode === "login" ? "Login" : "Register"}
              </legend>
              <div>
                <label class="label" for="email">
                  {props.data.mode === "login" ? "Email" : "Email/Username"}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  class="input validator"
                  placeholder={props.data.mode === "login"
                    ? "Email"
                    : "Email or Username"}
                  required
                />
                <div class="validator-hint">
                  {props.data.mode === "login"
                    ? "Enter a valid email"
                    : "Enter a valid email or username"}
                </div>
              </div>
              <div>
                <label class="label" for="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  class="input validator"
                  placeholder="Password"
                  required
                  pattern={passwordRegex.source}
                />
                <div class="validator-hint">Password is required</div>
              </div>
              {props.data.mode === "register" && (
                <div>
                  <label class="label" for="confirm-password">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    class="input validator"
                    placeholder="Confirm Password"
                    required
                    pattern={passwordRegex.source}
                  />
                  <div class="validator-hint">Passwords must match</div>
                </div>
              )}
              <button
                type="submit"
                class="btn btn-primary mt-4"
                id="submit-btn"
              >
                {props.data.mode === "login" ? "Login" : "Register"}
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
});
