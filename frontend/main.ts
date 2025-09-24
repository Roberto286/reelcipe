import { App, cors, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import { getCookies } from "jsr:@std/http/cookie";

export const app = new App<State>();

app.use(staticFiles());

app.use(cors());

// Pass a shared value from a middleware
app.use(async (ctx) => {
  ctx.state.shared = "hello";
  return await ctx.next();
});
// this is the same as the /api/:name route defined via a file. feel free to delete this!
app.get("/api2/:name", (ctx) => {
  const name = ctx.params.name;
  return new Response(
    `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`
  );
});

// this can also be defined via a file. feel free to delete this!
const exampleLoggerMiddleware = define.middleware((ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  return ctx.next();
});

const themeMiddleware = define.middleware((ctx) => {
  const { theme } = getCookies(ctx.req.headers);
  ctx.state.theme = theme;

  return ctx.next();
});

const authMiddleware = define.middleware(async (ctx) => {
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

app.use(exampleLoggerMiddleware);
app.use(themeMiddleware);
app.use(authMiddleware);

// Include file-system based routes here
app.fsRoutes();
