import { define } from "../utils.ts";
import { getCookies } from "jsr:@std/http/cookie";

const BACKEND_URL = "http://backend:8000";
const whitelist = ["/", "/login", "/logout", "/api/login"];

export const authGuardMiddleware = define.middleware(async (ctx) => {
  const url = new URL(ctx.req.url);
  const pathname = url.pathname;

  const isPublicRoute = whitelist.includes(pathname);

  if (!isPublicRoute && !ctx.state.authenticated) {
    // With Better Auth, session refresh is handled automatically by the cookie cache
    // If user is not authenticated at this point, redirect to login
    const cookies = getCookies(ctx.req.headers);
    const sessionToken = cookies["better_auth.session_token"];

    // Try to validate session one more time
    if (sessionToken) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
          method: "GET",
          headers: {
            Cookie: `better_auth.session_token=${sessionToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.session && data.user) {
            ctx.state.authenticated = true;
            ctx.state.user = data.user;
            ctx.state.session = data.session;
            return ctx.next();
          }
        }
      } catch (error) {
        console.error("Session validation failed:", error);
      }
    }

    // Block access
    if (pathname.startsWith("/api")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
        },
      });
    }
  }

  return ctx.next();
});
