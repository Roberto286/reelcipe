import { getCookies } from "jsr:@std/http/cookie";
import { define } from "../utils.ts";

// Global store for refresh tokens (server-side only)
export const refreshTokens = new Map<string, string>();

export const authMiddleware = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);
  const accessToken = cookies.access_token;
  const refreshToken = cookies.refresh_token;

  // Store refresh_token in state
  if (refreshToken) {
    ctx.state.refreshToken = refreshToken;
  }

  if (!accessToken) {
    console.log("Access token missing, proceeding to next middleware");
    return ctx.next();
  }

  try {
    const response = await fetch("http://auth-service:8000/verify", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.valid) {
        ctx.state.authenticated = true;
        ctx.state.user = data.user;
        ctx.state.refreshToken = refreshTokens.get(data.user.id);
        console.log("Authentication successful for user:", data.user.id);
      } else {
        console.log("Token invalid, proceeding to next middleware");
      }
    } else {
      console.log("Auth service returned error status:", response.status);
    }
  } catch (error) {
    console.error("Network error during authentication:", error);
    return new Response("Internal server error", { status: 500 });
  }

  return ctx.next();
});
