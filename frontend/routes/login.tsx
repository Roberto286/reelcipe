import { appendQueryParams, define, passwordRegex } from "../utils.ts";

export const MESSAGES = {
  INVALID_EMAIL: "Invalid email format",
  INVALID_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, digit, and special character",
  MISSING_FIELDS: "Email and password are required",
  LOGIN_SUCCESS: "Login successful",
  signup_SUCCESS: "Registration successful",
  SERVER_ERROR: "Internal server error",
};

const getRedirectUrl = (
  { mode, telegramId, telegramUsername }: {
    mode: string;
    telegramId: string;
    telegramUsername: string;
  },
) =>
  appendQueryParams("/login", {
    mode,
    telegram_id: telegramId,
    telegram_username: telegramUsername,
  });

export default define.page(function Login(ctx) {
  const url = new URL(ctx.req.url);
  const mode = url.searchParams.get("mode") === "signup" ? "signup" : "login";
  const telegramId = url.searchParams.get("telegram_id") || undefined;
  const telegramUsername = url.searchParams.get("telegram_username") ||
    undefined;
  return (
    <div class="mx-auto max-w-sm">
      <div role="tablist" class="tabs tabs-lift justify-center">
        <a
          role="tab"
          class={`tab ${mode === "login" ? "tab-active" : ""}`}
          href={getRedirectUrl({ telegramId, telegramUsername, mode: "login" })}
        >
          Login
        </a>
        <a
          role="tab"
          class={`tab ${mode === "signup" ? "tab-active" : ""}`}
          href={getRedirectUrl({
            telegramId,
            telegramUsername,
            mode: "signup",
          })}
        >
          Registrazione
        </a>
      </div>
      <div class="card bg-base-100 w-full shadow-2xl">
        <div class="card-body">
          <form
            action="/api/login"
            method="post"
            id="login-form"
            data-auto-disable
          >
            {telegramId && (
              <input
                type="hidden"
                name="telegram_id"
                value={telegramId}
              />
            )}
            {telegramUsername && (
              <input
                type="hidden"
                name="telegram_username"
                value={telegramUsername}
              />
            )}
            <input type="hidden" name="mode" value={mode} />
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                {mode === "login" ? "Login" : "signup"}
              </legend>
              <div>
                <label class="label" for="email">
                  {mode === "login" ? "Email" : "Email/Username"}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  class="input validator"
                  placeholder={mode === "login" ? "Email" : "Email or Username"}
                  required
                />
                <div class="validator-hint">
                  "Enter a valid email"
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
              {mode === "signup" && (
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
                {mode === "login" ? "Login" : "signup"}
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
});
