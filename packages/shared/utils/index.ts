export function createRedirectResponse(location: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  });
}

export function createErrorRedirect(message: string) {
  return createRedirectResponse(`/?error=${encodeURIComponent(message)}`);
}

export function createSuccessRedirect(message: string, recipeId?: number) {
  const params = new URLSearchParams({ message });
  if (recipeId) params.set("recipeId", recipeId.toString());
  return createRedirectResponse(`/?${params.toString()}`);
}
