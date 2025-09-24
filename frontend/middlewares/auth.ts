import { getCookies } from "jsr:@std/http/cookie";
import { define } from "../utils.ts";

export const authMiddleware = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);
  const accessToken = cookies.access_token;
  const refreshToken = cookies.refresh_token;

  if (!accessToken || !refreshToken) {
    console.log("Tokens missing, proceeding to next middleware");
    return ctx.next();
  }

  try {
    const response = await fetch(
      "http://auth-service:8000/session/validate-and-refresh",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.valid) {
        ctx.state.authenticated = true;
        ctx.state.user = data.user;
        console.log("Authentication successful for user:", data.user.id);
      } else {
        console.log("Tokens invalid, proceeding to next middleware");
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
