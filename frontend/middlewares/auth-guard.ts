import { define } from "../utils.ts";
import { refreshTokens } from "./auth.ts";
import { getCookies, setCookie } from "jsr:@std/http/cookie";

const whitelist = ["/", "/login", "/logout", "/api/login"];

export const authGuardMiddleware = define.middleware(async (ctx) => {
  const url = new URL(ctx.req.url);
  const pathname = url.pathname;

  const isPublicRoute = whitelist.includes(pathname);

  if (!isPublicRoute && !ctx.state.authenticated) {
    // Try proactive refresh
    const cookies = getCookies(ctx.req.headers);
    const userId = cookies.user_id;
    if (userId) {
      const refreshToken = refreshTokens.get(userId);

      if (refreshToken) {
        try {
          const refreshResponse = await fetch(
            "http://auth-service:8000/refresh",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                refresh_token: refreshToken,
              }),
            }
          );

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            const newAccessToken = data.access_token;
            const newRefreshToken = data.refresh_token;

            // Update server-side store
            refreshTokens.set(userId, newRefreshToken);

            // Set new access_token cookie
            const headers = new Headers();
            setCookie(headers, {
              name: "access_token",
              value: newAccessToken,
              httpOnly: true,
              path: "/",
              secure: ctx.req.url.startsWith("https://"),
              sameSite: "Lax",
              maxAge: 15 * 60,
            });

            // Set authenticated state
            ctx.state.authenticated = true;
            ctx.state.user = { id: userId }; // minimal user object

            // Continue to route with new token
            // But since cookies are set in headers, but for the request, it's already sent.
            // To make it work, we need to redirect to the same url, so the new request has the cookie.
            return new Response(null, {
              status: 302,
              headers: {
                Location: ctx.req.url,
                ...Object.fromEntries(headers.entries()),
              },
            });
          }
        } catch (error) {
          console.error("Proactive refresh failed:", error);
        }
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
          Location: "/",
        },
      });
    }
  }

  return ctx.next();
});
