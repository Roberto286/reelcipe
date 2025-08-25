import { PageProps } from "$fresh/server.ts";
import { handler } from "./handler.ts";
import { Props } from "./types.ts";

export const passwordRegex = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
);

export { handler };

export default function Login(props: PageProps<Props>) {
  const mode = props.data?.mode ?? "login";

  return (
    <section className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">Benvenuto</h1>
        <div>
          {/* Tabs */}
          <div className="flex justify-center mb-4">
            <a
              href="/login?mode=login"
              className={`px-4 py-2 ${
                mode === "login"
                  ? "border-b-2 border-blue-500 font-semibold"
                  : ""
              }`}
            >
              Login
            </a>
            <a
              href="/login?mode=register"
              className={`px-4 py-2 ${
                mode === "register"
                  ? "border-b-2 border-blue-500 font-semibold"
                  : ""
              }`}
            >
              Registrati
            </a>
          </div>
        </div>
        <form
          method="POST"
          action="/login"
          className="flex flex-col gap-4"
        >
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

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2"
          >
            {mode === "login" ? "Accedi" : "Registrati"}
          </button>
        </form>
      </div>
    </section>
  );
}
