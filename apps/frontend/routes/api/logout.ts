import { setCookie, getCookies } from "jsr:@std/http/cookie";
import { define, isSecureReq } from "../../utils.ts";

const BACKEND_URL = "http://backend:8000";

export const handler = define.handlers({
  async GET(ctx) {
    const cookies = getCookies(ctx.req.headers);
    const sessionToken = cookies["better-auth.session_token"];
    // Call Better Auth sign-out endpoint if session exists
    if (sessionToken) {
      try {
        await fetch(`${BACKEND_URL}/api/auth/sign-out`, {
          method: "POST",
          headers: {
            Cookie: `better-auth.session_token=${sessionToken}`,
          },
        });
      } catch (error) {
        console.error("Error signing out from backend:", error);
      }
    }

    const headers = new Headers();
    const secure = isSecureReq(ctx.req);

    // Clear Better Auth session cookie
    setCookie(headers, {
      name: "better-auth.session_token",
      value: "",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure,
      maxAge: 0,
    });

    // Clear user_id cookie
    setCookie(headers, {
      name: "user_id",
      value: "",
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
      secure,
      maxAge: 0,
    });

    headers.set("Location", "/");
    return new Response(null, { status: 303, headers });
  },
});
