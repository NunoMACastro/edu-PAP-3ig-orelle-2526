/** Testes de paginação dos pontos administrativos com maior volume. */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { BiometricAuditPage } from "../../src/pages/BiometricAuditPage.jsx";
import { StockAdminPage } from "../../src/pages/StockAdminPage.jsx";

const operationalMocks = vi.hoisted(() => ({
    apiRequest: vi.fn(),
    listProductsForAiCuration: vi.fn(),
}));

vi.mock("../../src/services/apiClient.js", () => ({
    apiRequest: operationalMocks.apiRequest,
}));

vi.mock("../../src/services/productAiCuration.js", () => ({
    listProductsForAiCuration: operationalMocks.listProductsForAiCuration,
}));

beforeEach(() => {
    operationalMocks.apiRequest.mockReset();
    operationalMocks.listProductsForAiCuration.mockReset();
});

it("pagina o stock sem carregar o catálogo completo", async () => {
    operationalMocks.listProductsForAiCuration
        .mockResolvedValueOnce({
            products: [
                { id: "product-one", name: "Creme", brandName: "Orélle", stock: 5 },
            ],
            pagination: { page: 1, pageSize: 20, total: 21, totalPages: 2 },
        })
        .mockResolvedValueOnce({
            products: [
                { id: "product-two", name: "Sérum", brandName: "Orélle", stock: 8 },
            ],
            pagination: { page: 2, pageSize: 20, total: 21, totalPages: 2 },
        });
    operationalMocks.apiRequest.mockResolvedValue({ products: [] });
    const user = userEvent.setup();
    render(<StockAdminPage />);

    await user.click(await screen.findByRole("button", { name: "Seguinte" }));

    expect(await screen.findByText("Sérum")).toBeVisible();
    expect(operationalMocks.listProductsForAiCuration).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, pageSize: 20 }),
        { signal: expect.any(AbortSignal) },
    );
});

it("acrescenta auditoria por cursor sem apagar a primeira página", async () => {
    operationalMocks.apiRequest.mockImplementation(async (path) => {
        if (path === "/admin/biometric-audit/logs?limit=20") {
            return {
                logs: [
                    {
                        id: "log-one",
                        action: "view_audit",
                        result: "allowed",
                        actorRole: "administrador",
                        resourceType: "audit",
                        createdAt: "2026-07-14T10:00:00.000Z",
                    },
                ],
                pageInfo: { nextCursor: "cursor-one", hasMore: true },
            };
        }
        if (path === "/admin/biometric-audit/alerts?limit=10") {
            return {
                alerts: [],
                pageInfo: { nextCursor: null, hasMore: false },
            };
        }
        if (path.includes("/logs?limit=20&cursor=")) {
            return {
                logs: [
                    {
                        id: "log-two",
                        action: "view_resource",
                        result: "allowed",
                        actorRole: "administrador",
                        resourceType: "report",
                        createdAt: "2026-07-13T10:00:00.000Z",
                    },
                ],
                pageInfo: { nextCursor: null, hasMore: false },
            };
        }
        throw new Error(`Pedido inesperado: ${path}`);
    });
    const user = userEvent.setup();
    render(<BiometricAuditPage />);

    await user.click(
        await screen.findByRole("button", { name: "Carregar mais eventos" }),
    );

    expect(screen.getByText("Consulta da auditoria")).toBeVisible();
    expect(await screen.findByText("Consulta de recurso")).toBeVisible();
    expect(
        screen.queryByRole("button", { name: "Carregar mais eventos" }),
    ).not.toBeInTheDocument();
});
