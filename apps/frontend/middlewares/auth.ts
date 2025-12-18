import { getCookies } from "jsr:@std/http/cookie";
import { define } from "../utils.ts";

const BACKEND_URL = "http://backend:8000";

export const authMiddleware = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);
  const sessionToken = cookies["better-auth.session_token"];

  if (!sessionToken) {
    console.log("Session token missing, proceeding to next middleware");
    return ctx.next();
  }

  try {
    // Validate session with Better Auth backend
    const response = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
      method: "GET",
      headers: {
        Cookie: `better-auth.session_token=${sessionToken}`,
      },
    });

    if (response.ok) {
      console.log("response :>> ", response);
      const data = await response.json();
      if (data.session && data.user) {
        ctx.state.authenticated = true;
        ctx.state.user = data.user;
        ctx.state.session = data.session;
        console.log("Authentication successful for user:", data.user.id);
      } else {
        console.log("No valid session, proceeding to next middleware");
      }
    } else {
      console.log("Backend returned error status:", response.status);
    }
  } catch (error) {
    console.error("Network error during authentication:", error);
    return new Response("Internal server error", { status: 500 });
  }

  return ctx.next();
});
