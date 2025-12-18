import { Context, Next } from "hono";
import { auth } from "../auth.ts";

export async function authMiddleware(c: Context, next: Next) {
  // Clone headers to modify
  const headers = new Headers(c.req.raw.headers);

  // If Authorization header is present, set the cookie header for Better Auth
  const authHeader = headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    headers.set("cookie", `better-auth.session_data=${token}`);
  }

  const session = await auth.api.getSession({ headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
}
