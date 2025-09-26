import { setCookie } from "jsr:@std/http/cookie";
import { define, isSecureReq } from "../../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    const headers = new Headers();
    const secure = isSecureReq(ctx.req);

    // Clear access_token cookie
    setCookie(headers, {
      name: "access_token",
      value: "",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure,
      maxAge: 0,
    });

    // Clear refresh_token cookie
    setCookie(headers, {
      name: "refresh_token",
      value: "",
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
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
