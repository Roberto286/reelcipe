export function createJsonResponse(
  message: string,
  status: number,
  data?: Record<string, unknown>,
) {
  return new Response(JSON.stringify({ message, ...data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function appendQueryParams(
  url: string,
  params: Record<string, string | undefined>,
): string {
  const urlObj = new URL(url, "https://example.com"); //just to make it possible to build the url
  Object.entries(params).forEach(([key, value]) => {
    if (value) urlObj.searchParams.set(key, value);
  });
  return urlObj.pathname + urlObj.search;
}
