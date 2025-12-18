import { define } from "../../utils.ts";

export default define.handlers(async function ImageProxy(ctx) {
  const url = new URL(ctx.req.url).searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  const res = await fetch(url);
  const body = await res.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
