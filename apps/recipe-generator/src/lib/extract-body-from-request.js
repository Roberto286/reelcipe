export function extractBodyFromRequest(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString(); // Convert Buffer to string
    });

    req.on("end", () => {
      try {
        const parsedBody = JSON.parse(body);
        resolve(parsedBody);
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}
