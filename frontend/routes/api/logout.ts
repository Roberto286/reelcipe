import { setCookie } from "jsr:@std/http/cookie";
import { define, isSecureReq } from "../../utils.ts";
import { refreshTokens } from "../../middlewares/auth.ts";

export const handler = define.handlers({
  GET(ctx) {
    // Clear refresh token from server-side store
    if (ctx.state.user) {
      refreshTokens.delete(ctx.state.user.id);
    }
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
