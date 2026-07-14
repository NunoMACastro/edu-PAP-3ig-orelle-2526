/** Testes browser-like dos fallbacks de enums nas páginas reais. */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminProductCreatePage } from "../../src/pages/AdminProductCreatePage.jsx";
import { BiometricAuditPage } from "../../src/pages/BiometricAuditPage.jsx";
import { BiometricDataRequestPage } from "../../src/pages/BiometricDataRequestPage.jsx";
import { ProductSearchPage } from "../../src/pages/ProductSearchPage.jsx";
import { SkinComparisonPage } from "../../src/pages/SkinComparisonPage.jsx";

const consumerMocks = vi.hoisted(() => ({
    apiRequest: vi.fn(),
    useAuth: vi.fn(),
}));

vi.mock("../../src/services/apiClient.js", () => ({
    apiRequest: consumerMocks.apiRequest,
}));

vi.mock("../../src/context/AuthContext.jsx", () => ({
    useAuth: consumerMocks.useAuth,
}));

/** Renderiza uma página dependente de Router. */
function renderInRouter(element, initialEntry = "/") {
    return render(
        <MemoryRouter
            initialEntries={[initialEntry]}
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            {element}
        </MemoryRouter>,
    );
}

describe("consumidores de enums públicos", () => {
    beforeEach(() => {
        consumerMocks.apiRequest.mockReset();
        consumerMocks.useAuth.mockReturnValue({
            user: { role: "cliente", email: "cliente@example.test" },
            forgetSession: vi.fn(),
        });
    });

    it("mostra tipos de pele conhecidos e unknown neutro na comparação", async () => {
        consumerMocks.apiRequest.mockResolvedValue({
            analyses: [
                {
                    selectionKey: "first",
                    date: "2026-01-01T10:00:00.000Z",
                    skinType: "nao_conclusivo",
                },
                {
                    selectionKey: "second",
                    date: "2026-02-01T10:00:00.000Z",
                    skinType: "future_skin_type",
                },
            ],
        });
        renderInRouter(<SkinComparisonPage />);

        expect(
            (await screen.findAllByRole("option", {
                name: /pele Não conclusivo/,
            })).length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByRole("option", {
                name: /pele Tipo de pele indisponível/,
            }).length,
        ).toBeGreaterThan(0);
        expect(screen.queryByText(/future_skin_type/)).not.toBeInTheDocument();
    });

    it("apresenta fallbacks tipados num pedido de privacidade desconhecido", async () => {
        consumerMocks.apiRequest.mockResolvedValue({
            requests: [
                {
                    id: "privacy-one",
                    scope: "future_scope",
                    action: "future_action",
                    status: "future_status",
                    resources: ["future_resource"],
                    createdAt: "2026-02-01T10:00:00.000Z",
                },
            ],
        });
        renderInRouter(<BiometricDataRequestPage />, "/conta/privacidade-biometrica");

        expect(await screen.findByText("Ação indisponível")).toBeVisible();
        expect(screen.getByText("Estado indisponível")).toBeVisible();
        expect(screen.getByText(/Âmbito indisponível/)).toBeVisible();
        expect(screen.getByText(/Recurso indisponível/)).toBeVisible();
        for (const rawValue of [
            "future_scope",
            "future_action",
            "future_status",
            "future_resource",
        ]) {
            expect(screen.queryByText(rawValue)).not.toBeInTheDocument();
        }
    });

    it("não humaniza auditoria desconhecida por substituição de underscores", async () => {
        consumerMocks.apiRequest.mockImplementation(async (path) => {
            if (path.includes("/logs?")) {
                return {
                    logs: [
                        {
                            id: "audit-one",
                            action: "future_event",
                            result: "future_outcome",
                            actorRole: "future_role",
                            resourceType: "future_resource",
                            alertRaised: false,
                            createdAt: "2026-02-01T10:00:00.000Z",
                        },
                    ],
                    pageInfo: { nextCursor: null, hasMore: false },
                };
            }
            return {
                alerts: [],
                pageInfo: { nextCursor: null, hasMore: false },
            };
        });
        render(<BiometricAuditPage />);

        expect(await screen.findByText("Evento indisponível")).toBeVisible();
        expect(screen.getByText("Resultado indisponível")).toBeVisible();
        expect(screen.getByText("Perfil de acesso indisponível")).toBeVisible();
        expect(screen.getByText("Recurso auditado indisponível")).toBeVisible();
        expect(screen.queryByText(/Future event/)).not.toBeInTheDocument();
    });

    it("não reflete o tipo de pele desconhecido num cartão de catálogo", async () => {
        consumerMocks.useAuth.mockReturnValue({ user: null });
        consumerMocks.apiRequest.mockImplementation(async (path) => {
            if (path === "/catalog/categories") return { categories: [] };
            if (path === "/catalog/products") {
                return {
                    products: [
                        {
                            id: "product-one",
                            name: "Produto seguro",
                            brandName: "Orélle",
                            description: "Descrição pública do produto.",
                            imageUrl: "/assets/products/produto.webp",
                            priceCents: 1_000,
                            stock: 3,
                            skinTypes: ["future_skin_type"],
                        },
                    ],
                };
            }
            throw new Error(`Pedido inesperado: ${path}`);
        });
        renderInRouter(<ProductSearchPage />, "/produtos");

        expect(await screen.findByText("Tipo de pele indisponível")).toBeVisible();
        expect(screen.queryByText("future_skin_type")).not.toBeInTheDocument();
    });

    it("apresenta labels PT-PT no formulário de produto", () => {
        render(<AdminProductCreatePage />);

        expect(screen.getByRole("checkbox", { name: "Sensível" })).toBeVisible();
        expect(
            screen.getByRole("textbox", {
                name: "Endereço da imagem do produto",
            }),
        ).toBeVisible();
        expect(screen.queryByText("sensivel")).not.toBeInTheDocument();
        expect(screen.queryByText("Imagem URL")).not.toBeInTheDocument();
    });
});
