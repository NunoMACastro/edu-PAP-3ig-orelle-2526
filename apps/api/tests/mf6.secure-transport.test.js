import { describe, expect, it, vi } from "vitest";
import { requireHttps } from "../src/middlewares/secure-transport.middleware.js";

function buildReq(proto = "http") {
    // O mock representa o protocolo original recebido do proxy sem depender de certificados reais.
    return { secure: false, get: () => proto };
}

describe("BK-MF6-05 transporte seguro", () => {
    it("permite desenvolvimento local por HTTP", () => {
        const next = vi.fn();
        requireHttps({ nodeEnv: "development" })(buildReq("http"), {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    it("permite produção quando proxy indica HTTPS", () => {
        const next = vi.fn();
        const res = { setHeader: vi.fn() };
        requireHttps({ nodeEnv: "production" })(buildReq("https"), res, next);
        // HSTS só deve surgir no caminho seguro para não mascarar pedidos de produção inseguros.
        expect(res.setHeader).toHaveBeenCalledWith(
            "Strict-Transport-Security",
            expect.stringContaining("max-age"),
        );
    });

    it("bloqueia produção insegura", () => {
        const next = vi.fn();
        requireHttps({ nodeEnv: "production" })(buildReq("http"), {}, next);
        // O erro é controlado e não revela detalhes da infraestrutura.
        expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
    });
});