import { appendQueryParams, define } from "../utils.ts";
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
});

export default define.page<typeof handler>(async function Login(props) {
  return (
    <div class="w-1/2 mx-auto">
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
      <form action="/login">
        <fieldset class="fieldset bg-base-200 border-base-300 rounded-box border p-4 w-full">
          <legend class="fieldset-legend">{props.data.mode}</legend>

          <label class="label">Email</label>
          <input type="email" class="input" placeholder="Email" />

          <label class="label">Password</label>
          <input type="password" class="input" placeholder="Password" />

          <button type="submit" class="btn btn-primary mt-4">Login</button>
        </fieldset>
      </form>
    </div>
  );
});
