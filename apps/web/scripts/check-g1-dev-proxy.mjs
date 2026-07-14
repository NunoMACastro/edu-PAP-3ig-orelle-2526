/**
 * Prova real do proxy `/api` do servidor Vite sem usar serviços externos.
 */
import assert from "node:assert/strict";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let receivedPath = null;
const apiServer = createHttpServer((request, response) => {
    receivedPath = request.url;
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ proxied: true }));
});

await new Promise((resolve, reject) => {
    apiServer.once("error", reject);
    apiServer.listen(0, "127.0.0.1", resolve);
});

const apiAddress = apiServer.address();
assert.equal(typeof apiAddress, "object");
process.env.VITE_API_PROXY_TARGET = `http://127.0.0.1:${apiAddress.port}`;

const vite = await createViteServer({
    configFile: path.join(webRoot, "vite.config.js"),
    logLevel: "silent",
    server: { host: "127.0.0.1", port: 0, strictPort: false },
});

try {
    await vite.listen();
    const webAddress = vite.httpServer?.address();
    assert.equal(typeof webAddress, "object");

    const response = await fetch(
        `http://127.0.0.1:${webAddress.port}/api/proxy-probe`,
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { proxied: true });
    assert.equal(receivedPath, "/api/proxy-probe");
    process.stdout.write("G1 dev proxy OK: /api encaminhado apenas em loopback\n");
} finally {
    await vite.close();
    await new Promise((resolve, reject) => {
        apiServer.close((error) => (error ? reject(error) : resolve()));
    });
    delete process.env.VITE_API_PROXY_TARGET;
}
