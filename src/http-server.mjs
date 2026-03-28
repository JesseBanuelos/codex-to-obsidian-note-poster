import http from "node:http";

import { handleCreateNoteRequest } from "./note-service.mjs";

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body === "" ? {} : JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

export function startNotePosterServer({
  host = "127.0.0.1",
  port,
  expectedApiKey,
  vaultPath,
  defaultFolder,
  logger = console,
}) {
  const server = http.createServer(async (request, response) => {
    if (request.method === "POST" && request.url === "/notes") {
      try {
        const body = await readJsonBody(request);
        const result = await handleCreateNoteRequest({
          headers: request.headers,
          expectedApiKey,
          body,
          vaultPath,
          defaultFolder,
        });

        response.writeHead(result.status, result.headers);
        response.end(result.body);
      } catch (error) {
        response.writeHead(400, {
          "content-type": "application/json; charset=utf-8",
        });
        response.end(
          JSON.stringify(
            {
              error: error instanceof Error ? error.message : String(error),
            },
            null,
            2
          )
        );
      }
      return;
    }

    response.writeHead(404, {
      "content-type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify({ error: "Not found" }, null, 2));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      logger.info?.(`Obsidian Note Poster listening on http://${host}:${port}/notes`);
      resolve(server);
    });
  });
}
