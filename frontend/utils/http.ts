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
