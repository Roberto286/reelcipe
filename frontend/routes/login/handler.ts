import { Handlers, PageProps } from "$fresh/server.ts";
import { passwordRegex } from "./index.tsx";
import { Props } from "./types.ts";

export const handler: Handlers<Props> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") ?? "login";
    return ctx.render({ mode });
  },
  async POST(req) {
    const form = await req.formData();
    const password = form.get("password")?.toString() || "";

    if (!passwordRegex.test(password)) {
      return new Response("Password non valida", { status: 400 });
    }

    return new Response("Registrazione OK");
  },
};
