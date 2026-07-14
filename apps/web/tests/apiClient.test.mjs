/**
 * Testes sem browser real do cliente HTTP common da Orélle.
 */
import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import {
    apiDownload,
    ApiError,
    apiRequest,
    AUTH_SESSION_EXPIRED_EVENT,
    clearCsrfTokenCache,
    CSRF_HEADER_NAME,
    FILE_REQUEST_TIMEOUT_MS,
    getPublicErrorMessage,
    JSON_REQUEST_TIMEOUT_MS,
} from "../src/services/apiClient.js";

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;

afterEach(() => {
    clearCsrfTokenCache();
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
});

test("usa /api same-origin, cookie e JSON apenas quando existe body", async () => {
    const received = [];
    globalThis.fetch = async (url, options) => {
        received.push({ url, options });

        if (url === "/api/auth/csrf") {
            return new Response(
                JSON.stringify({ csrfToken: "a".repeat(43) }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    };

    const result = await apiRequest("/example", {
        method: "POST",
        body: JSON.stringify({ value: 1 }),
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(received.length, 2);
    assert.equal(received[0].url, "/api/auth/csrf");
    assert.equal(received[1].url, "/api/example");
    assert.equal(received[1].options.credentials, "include");
    assert.equal(
        received[1].options.headers.get("Content-Type"),
        "application/json",
    );
    assert.equal(
        received[1].options.headers.get(CSRF_HEADER_NAME),
        "a".repeat(43),
    );
    assert.ok(received[1].options.signal instanceof AbortSignal);
});

test("partilha a emissão CSRF entre mutações concorrentes", async () => {
    let csrfRequests = 0;
    const mutationHeaders = [];
    globalThis.fetch = async (url, options) => {
        if (url === "/api/auth/csrf") {
            csrfRequests += 1;
            await new Promise((resolve) => setTimeout(resolve, 5));
            return new Response(
                JSON.stringify({ csrfToken: "b".repeat(43) }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        mutationHeaders.push(options.headers.get(CSRF_HEADER_NAME));
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    };

    await Promise.all([
        apiRequest("/cart/items", { method: "POST", body: "{}" }),
        apiRequest("/preferences/me", { method: "PUT", body: "{}" }),
    ]);

    assert.equal(csrfRequests, 1);
    assert.deepEqual(mutationHeaders, ["b".repeat(43), "b".repeat(43)]);
});

test("cancelar durante o bootstrap CSRF impede a mutação imediatamente", async () => {
    let resolveCsrf;
    let mutationRequests = 0;
    globalThis.fetch = (url) => {
        if (url === "/api/auth/csrf") {
            return new Promise((resolve) => {
                resolveCsrf = resolve;
            });
        }

        mutationRequests += 1;
        return Promise.resolve(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );
    };

    const controller = new AbortController();
    const pending = apiRequest("/cart/items", {
        method: "POST",
        body: "{}",
        signal: controller.signal,
    });
    await Promise.resolve();
    controller.abort();

    await assert.rejects(
        pending,
        (error) => error instanceof ApiError && error.code === "REQUEST_ABORTED",
    );
    assert.equal(mutationRequests, 0);

    resolveCsrf(
        new Response(JSON.stringify({ csrfToken: "z".repeat(43) }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }),
    );
    await Promise.resolve();
});

test("não pede CSRF para login/registo e roda a cache quando a sessão muda", async () => {
    const requestedUrls = [];
    globalThis.fetch = async (url) => {
        requestedUrls.push(url);
        if (url === "/api/auth/csrf") {
            return new Response(
                JSON.stringify({ csrfToken: "c".repeat(43) }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }
        return new Response(JSON.stringify({ user: { id: "user-public" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    };

    await apiRequest("/auth/login", { method: "POST", body: "{}" });
    await apiRequest("/auth/register", { method: "POST", body: "{}" });
    await apiRequest("/cart/items", { method: "POST", body: "{}" });
    await apiRequest("/auth/login", { method: "POST", body: "{}" });
    await apiRequest("/cart/items", { method: "POST", body: "{}" });

    assert.deepEqual(requestedUrls, [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/csrf",
        "/api/cart/items",
        "/api/auth/login",
        "/api/auth/csrf",
        "/api/cart/items",
    ]);
});

test("lança ApiError com status, código, detalhes e requestId", async () => {
    globalThis.fetch = async () =>
        new Response(
            JSON.stringify({
                error: {
                    message: "Dados inválidos",
                    code: "VALIDATION_ERROR",
                    details: { field: "email" },
                    requestId: "req-public-1",
                },
            }),
            { status: 422, headers: { "Content-Type": "application/json" } },
        );

    await assert.rejects(
        apiRequest("/invalid"),
        (error) =>
            error instanceof ApiError &&
            error.status === 422 &&
            error.code === "VALIDATION_ERROR" &&
            error.requestId === "req-public-1" &&
            error.details.field === "email",
    );
});

test("converte falhas técnicas em mensagens de produto", () => {
    assert.equal(
        getPublicErrorMessage("Token CSRF inválido", 403),
        "Não foi possível validar a sessão. Atualiza a página e tenta novamente.",
    );
    assert.equal(
        getPublicErrorMessage("Resposta OpenAI semanticamente inválida", 409),
        "Não foi possível concluir esta ação. Tenta novamente.",
    );
    assert.equal(
        getPublicErrorMessage("Erro interno do servidor", 500),
        "Não foi possível concluir este pedido. Tenta novamente.",
    );
    assert.equal(
        getPublicErrorMessage("O email já está registado", 409),
        "O email já está registado",
    );
});

test("rejeita respostas 2xx cujo contrato JSON é inválido", async () => {
    globalThis.fetch = async () =>
        new Response("resposta-invalida", {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "X-Request-Id": "req-invalid-json",
            },
        });

    await assert.rejects(
        apiRequest("/invalid-json"),
        (error) =>
            error instanceof ApiError &&
            error.status === 200 &&
            error.code === "INVALID_API_RESPONSE" &&
            error.requestId === "req-invalid-json",
    );
});

test("emite evento global quando a sessão recebe 401", async () => {
    const events = [];
    globalThis.window = { dispatchEvent: (event) => events.push(event) };
    globalThis.fetch = async () =>
        new Response(
            JSON.stringify({
                error: { message: "Sessão inválida", requestId: "req-401" },
            }),
            { status: 401, headers: { "Content-Type": "application/json" } },
        );

    await assert.rejects(apiRequest("/auth/me"), ApiError);

    assert.equal(events.length, 1);
    assert.equal(events[0].type, AUTH_SESSION_EXPIRED_EVENT);
});

test("distingue timeout de cancelamento explícito", async () => {
    globalThis.fetch = (url, { signal }) =>
        new Promise((resolve, reject) => {
            signal.addEventListener("abort", () => reject(signal.reason), {
                once: true,
            });
        });

    await assert.rejects(
        apiRequest("/slow", { timeoutMs: 5 }),
        (error) => error instanceof ApiError && error.code === "REQUEST_TIMEOUT",
    );

    const controller = new AbortController();
    const pending = apiRequest("/cancelled", {
        signal: controller.signal,
        timeoutMs: 1_000,
    });
    controller.abort();

    await assert.rejects(
        pending,
        (error) => error instanceof ApiError && error.code === "REQUEST_ABORTED",
    );
});

test("preserva 204 e aplica timeout alargado a downloads", async () => {
    globalThis.fetch = async () => new Response(null, { status: 204 });

    assert.equal(await apiRequest("/empty"), null);
    const download = await apiDownload("/file");
    assert.equal(download.status, 204);
    assert.equal(download.blob.size, 0);
    assert.equal(JSON_REQUEST_TIMEOUT_MS, 10_000);
    assert.equal(FILE_REQUEST_TIMEOUT_MS, 30_000);
});
