/**
 * Testes do BK-MF6-03 / RNF07.
 *
 * Confirmam que a API tem endpoint leve de saúde, preserva endpoints protegidos
 * sem sessão e devolve erro controlado quando uma rota ultrapassa o timeout.
 */
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { errorMiddleware } from "../src/middlewares/error.middleware.js";
import { requestTimeout } from "../src/middlewares/request-timeout.middleware.js";

/**
 * Cria uma app isolada para testar timeout sem depender de rotas reais.
 *
 * @function createSlowTimeoutApp
 * @returns {import("express").Express} App Express com uma rota lenta controlada.
 */
function createSlowTimeoutApp() {
    const app = express();

    app.use(requestTimeout(20));
    app.get("/api/test/slow", async (req, res) => {
        // A espera simula uma rota degradada e ensina o aluno a validar o negativo.
        await new Promise((resolve) => setTimeout(resolve, 60));
        if (res.headersSent || req.hasRequestTimedOut?.()) {
            // Depois do timeout, a rota pára para não tentar enviar uma segunda resposta.
            return;
        }

        res.json({ status: "late" });
    });
    app.use(errorMiddleware);

    return app;
}

describe("BK-MF6-03 / RNF07 - concorrência e estabilidade", () => {
    it("responde ao health check com payload técnico minimizado", async () => {
        const response = await request(createApp()).get("/api/health");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: "ok",
            app: "orelle",
            checks: { http: "ok" },
        });
    });

    it("mantém endpoint protegido bloqueado sem sessão", async () => {
        const response = await request(createApp()).get("/api/auth/me");

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Autenticação obrigatória");
    });

    it("devolve 503 controlado quando uma rota excede o timeout", async () => {
        const response = await request(createSlowTimeoutApp()).get("/api/test/slow");

        expect(response.status).toBe(503);
        expect(response.body.error.message).toBe("Pedido demorou demasiado. Tenta novamente.");
    });
});