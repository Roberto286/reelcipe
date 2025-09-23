import { createDefine } from "fresh";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  theme: string;
  shared: string;
}

export const define = createDefine<State>();

//#region HTTP
export function createJsonResponse(
  message: string,
  status: number,
  data?: Record<string, unknown>
) {
  return new Response(JSON.stringify({ message, ...data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function appendQueryParams(
  url: string,
  params: Record<string, string | undefined>
): string {
  const urlObj = new URL(url, "https://example.com"); //just to make it possible to build the url
  Object.entries(params).forEach(([key, value]) => {
    if (value) urlObj.searchParams.set(key, value);
  });
  return urlObj.pathname + urlObj.search;
}

//#endregion

//#region REGEXES

// Password validation regex: requires at least 8 characters with uppercase, lowercase, digit, and special character
export const passwordRegex = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
);

// Email validation regex (basic)
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//#endregion
