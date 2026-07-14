/** Testes do sumário de erros públicos da API. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorSummary } from "../../src/components/ErrorSummary.jsx";
import { ApiError } from "../../src/services/apiClient.js";

describe("ErrorSummary", () => {
    it("apresenta mensagem, validação pública e requestId sanitizado", () => {
        render(
            <ErrorSummary
                error={
                    new ApiError({
                        message: "Produto inválido",
                        status: 400,
                        details: {
                            name: "Nome demasiado curto",
                            nested: { secret: "não renderizar" },
                            secret: "token-interno",
                            stack: "caminho interno",
                            path: "/srv/private/report",
                        },
                        requestId: "req-public-42",
                    })
                }
            />,
        );

        const summary = screen.getByRole("alert");
        expect(summary).toHaveTextContent("Produto inválido");
        expect(summary).toHaveTextContent("Nome: Nome demasiado curto");
        expect(summary).toHaveTextContent("Referência do pedido: req-public-42");
        expect(summary).not.toHaveTextContent("não renderizar");
        expect(summary).not.toHaveTextContent("token-interno");
        expect(summary).not.toHaveTextContent("caminho interno");
        expect(summary).not.toHaveTextContent("/srv/private/report");
    });
});
