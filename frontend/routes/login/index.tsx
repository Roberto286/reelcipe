import { PageProps } from "$fresh/server.ts";
import { Button } from "../../components/Button.tsx";

import { appendQueryParams, passwordRegex } from "../../utils.ts";
import { handler } from "./handler.ts";
import { Props } from "./types.ts";

export { handler };

export default function Login(props: PageProps<Props>) {
  const mode = props.data?.mode ?? "login";
  const telegramId = props.data.telegramId;
  const telegramUsername = props.data.telegramUsername;

  const getRedirectUrl = (mode: string) =>
    appendQueryParams("/login", {
      mode,
      telegram_id: telegramId,
      telegram_username: telegramUsername,
    });

  return (
    <section className="w-1/2 bg-secondary">
      <div className="w-full">
        <h1 className="text-2xl font-bold text-center mb-4">Benvenuto</h1>
        <div>
          <div role="tablist" className="tabs tabs-box">
            <a role="tab" className="tab" href={getRedirectUrl("login")}>
              Login
            </a>
            <a
              role="tab"
              className="tab tab-active"
              href={getRedirectUrl("register")}
            >
              Registrati
            </a>
          </div>
          {/* Tabs */}
          {
            /* <div className="flex justify-center mb-4">
            <a
              href={getRedirectUrl("login")}
              className={`px-4 py-2 ${
                mode === "login"
                  ? "border-b-2 border-blue-500 font-semibold"
                  : ""
              }`}
            >
              Login
            </a>
            <a
              href={getRedirectUrl("register")}
              className={`px-4 py-2 ${
                mode === "register"
                  ? "border-b-2 border-blue-500 font-semibold"
                  : ""
              }`}
            >
              Registrati
            </a>
          </div> */
          }
        </div>
        <form
          method="POST"
          action="/login"
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="mode" value={mode} />
          {props.data?.telegramId && (
            <input
              type="hidden"
              name="telegram_id"
              value={props.data.telegramId}
            />
          )}
          {props.data?.telegramUsername && (
            <input
              type="hidden"
              name="username"
              value={props.data.telegramUsername}
            />
          )}
          <input
            type="text"
            name="email"
            placeholder="Email"
            className="border rounded-lg p-2"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="border rounded-lg p-2"
            required
            minLength={8}
            pattern={passwordRegex.source}
            title="La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale."
          />

          {mode === "register" && (
            <input
              type="password"
              name="confirm-password"
              placeholder="Conferma password"
              className="border rounded-lg p-2"
              required
            />
          )}

          <Button type="submit">REGISTRATI</Button>
        </form>
      </div>
    </section>
  );
}
