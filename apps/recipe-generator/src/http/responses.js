export function sendBadRequest(res, msg) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: `Bad Request: ${msg}` }));
}

export function sendMethodNotAllowed(res, method) {
  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: `Method: ${method} Not Allowed` }));
}

export function sendNotFound(res, url) {
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: `${url} Not Found` }));
}

export function sendUnauthorized(res) {
  res.writeHead(401, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: `Unauthorized` }));
}
