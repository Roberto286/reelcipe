import { getCookies } from "jsr:@std/http/cookie";
import { define } from "../utils.ts";

export const themeMiddleware = define.middleware((ctx) => {
  const { theme } = getCookies(ctx.req.headers);
  ctx.state.theme = theme;

  return ctx.next();
});
