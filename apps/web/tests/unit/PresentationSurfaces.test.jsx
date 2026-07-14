/** Testes comportamentais dos labels públicos e copy principal. */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrelleMockupHome } from "../../src/components/OrelleMockupHome.jsx";
import { AdminReviewsPage } from "../../src/pages/AdminReviewsPage.jsx";
import { CheckoutPage } from "../../src/pages/CheckoutPage.jsx";
import { ProductDetailsPage } from "../../src/pages/ProductDetailsPage.jsx";

const surfaceMocks = vi.hoisted(() => ({
    apiRequest: vi.fn(),
    useAuth: vi.fn(),
    useCart: vi.fn(),
    addItem: vi.fn(),
    refreshCart: vi.fn(),
}));

vi.mock("../../src/services/apiClient.js", () => ({
    apiRequest: surfaceMocks.apiRequest,
}));

vi.mock("../../src/context/AuthContext.jsx", () => ({
    useAuth: surfaceMocks.useAuth,
}));

vi.mock("../../src/context/CartContext.jsx", () => ({
    useCart: surfaceMocks.useCart,
}));

/** Renderiza uma superfície que contém links reais. */
function renderInRouter(element) {
    return render(
        <MemoryRouter
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            {element}
        </MemoryRouter>,
    );
}

describe("labels e copy públicos", () => {
    beforeEach(() => {
        surfaceMocks.apiRequest.mockReset();
        surfaceMocks.addItem.mockReset();
        surfaceMocks.refreshCart.mockReset();
        surfaceMocks.refreshCart.mockResolvedValue({ items: [], totalCents: 0 });
        surfaceMocks.useAuth.mockReturnValue({
            user: {
                email: "admin@example.test",
                role: "administrador",
            },
        });
        surfaceMocks.useCart.mockReturnValue({
            addItem: surfaceMocks.addItem,
            actionStatus: "idle",
            itemCount: 0,
            openCart: vi.fn(),
            refreshCart: surfaceMocks.refreshCart,
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("mostra a marca Orélle e traduz o tipo de acesso na home", async () => {
        surfaceMocks.apiRequest.mockResolvedValue({ products: [] });
        renderInRouter(<OrelleMockupHome />);

        expect(screen.getByRole("link", { name: "Orélle início" })).toBeVisible();
        expect(await screen.findByText(/admin@example\.test · Administrador/)).toBeVisible();
        expect(screen.getByRole("heading", { name: "Aparência" })).toBeVisible();
        expect(screen.queryByText(/administrador$/)).not.toBeInTheDocument();
    });

    it("promove a consulta com benefícios e uma inspiração visual inequívoca", async () => {
        surfaceMocks.useAuth.mockReturnValue({ user: null });
        surfaceMocks.apiRequest.mockResolvedValue({ products: [] });
        renderInRouter(<OrelleMockupHome />);

        expect(
            screen.getByRole("img", {
                name: "Retrato editorial de uma mulher de cabelo encaracolado em luz suave",
            }),
        ).toHaveAttribute("fetchpriority", "high");
        expect(
            screen.getByRole("heading", {
                name: "Beleza que parte de ti",
            }),
        ).toBeVisible();
        const consultationBenefits = screen.getByRole("list", {
            name: "Benefícios da consulta",
        });
        expect(within(consultationBenefits).getAllByRole("listitem")).toHaveLength(3);
        expect(
            within(consultationBenefits).getByRole("heading", {
                name: "Define os teus objetivos",
            }),
        ).toBeVisible();
        expect(
            within(consultationBenefits).getByRole("heading", {
                name: "Conversa ao teu ritmo",
            }),
        ).toBeVisible();
        expect(
            within(consultationBenefits).getByRole("heading", {
                name: "Recebe o teu relatório",
            }),
        ).toBeVisible();
        expect(
            screen.getByRole("img", {
                name: "Retrato original sem a pré-visualização de maquilhagem",
            }),
        ).toHaveAttribute("width", "960");
        expect(
            screen.getByRole("img", {
                name: "Pré-visualização de maquilhagem luminosa em tons rose-gold",
            }),
        ).toHaveAttribute("height", "960");
        expect(
            screen.getAllByText(
                "Imagem gerada por IA — o resultado real poderá variar.",
            ),
        ).toHaveLength(1);
        expect(screen.queryByText(/OpenAI/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Exemplo ilustrativo/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Exemplo publicitário/i)).not.toBeInTheDocument();
        expect(
            screen.queryByRole("group", { name: /Mensagem da IA/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("heading", {
                name: "Compreender a tua pele muda tudo",
            }),
        ).toBeVisible();
        const skinDialogue = screen.getByRole("article", {
            name: "Conversa sobre cuidados de pele",
        });
        const skinMessages = within(skinDialogue).getByRole("list", {
            name: "Perguntas e respostas da consulta",
        });
        expect(within(skinMessages).getAllByRole("listitem")).toHaveLength(4);
        expect(within(skinDialogue).getAllByText("Orélle")).toHaveLength(2);
        expect(within(skinDialogue).getAllByText("Tu")).toHaveLength(2);
        expect(within(skinDialogue).queryByRole("textbox")).not.toBeInTheDocument();
        expect(within(skinDialogue).queryByRole("button")).not.toBeInTheDocument();
        expect(
            screen.getAllByText(
                "Orientação cosmética — não substitui avaliação médica.",
            ),
        ).toHaveLength(1);
        expect(
            screen.getByRole("link", { name: "Descobrir a minha consulta" }),
        ).toHaveAttribute("href", "/login");
        const consultationLinks = screen.getAllByRole("link", {
            name: "Começar a minha consulta",
        });
        expect(consultationLinks.length).toBeGreaterThan(0);
        for (const link of consultationLinks) {
            expect(link).toHaveAttribute("href", "/login");
        }
        expect(document.querySelectorAll(".mockup-feature-card__icon")).toHaveLength(4);
        expect(screen.queryByText("SK")).not.toBeInTheDocument();
        expect(screen.queryByText("RH")).not.toBeInTheDocument();
        expect(screen.queryByText("PD")).not.toBeInTheDocument();
        expect(
            screen.getByRole("heading", {
                name: "Descobre o que combina contigo",
            }),
        ).toBeVisible();
        expect(
            screen.getByText("Beleza, cuidado e escolhas pensadas para ti."),
        ).toBeVisible();
        expect(
            screen.queryByText(
                /fluxo atual|limitações visíveis no fluxo|perfil de acesso|ligados à API|estado confirmado pelo servidor/i,
            ),
        ).not.toBeInTheDocument();
    });

    it("traduz estados de moderação e falha fechado para valores futuros", async () => {
        surfaceMocks.apiRequest.mockResolvedValue({
            reviews: [
                {
                    id: "review-published",
                    rating: 5,
                    status: "published",
                    comment: "Avaliação pública.",
                },
                {
                    id: "review-future",
                    rating: 4,
                    status: "internal_future",
                    comment: "Estado desconhecido.",
                },
            ],
        });
        render(<AdminReviewsPage />);

        expect(await screen.findByText("Publicada")).toBeVisible();
        expect(screen.getByText("Estado indisponível")).toBeVisible();
        expect(screen.getByText("5/5")).toBeVisible();
        expect(screen.getByText("4/5")).toBeVisible();
        expect(screen.queryByText(/internal_future/)).not.toBeInTheDocument();
    });

    it("traduz encomenda e vouchers sem refletir enums desconhecidos", async () => {
        vi.stubGlobal("crypto", {
            randomUUID: vi.fn(() => "123e4567-e89b-42d3-a456-426614174000"),
        });
        surfaceMocks.useCart.mockReturnValue({
            addItem: surfaceMocks.addItem,
            actionStatus: "idle",
            itemCount: 0,
            openCart: vi.fn(),
            refreshCart: surfaceMocks.refreshCart,
            voucherCode: "VOUCHER-A",
            setVoucherCode: vi.fn(),
        });
        surfaceMocks.apiRequest.mockImplementation(async (path) => {
            if (path === "/me/vouchers") {
                return {
                    vouchers: [
                        {
                            id: "voucher-active",
                            code: "VOUCHER-A",
                            remainingCents: 500,
                            status: "active",
                        },
                        {
                            id: "voucher-future",
                            code: "VOUCHER-B",
                            remainingCents: 200,
                            status: "internal_future",
                        },
                    ],
                };
            }
            if (path === "/orders/checkout") {
                return {
                    order: {
                        id: "order-one",
                        status: "internal_future",
                        subtotalCents: 1_000,
                        discountCents: 0,
                        totalCents: 1_000,
                        voucher: null,
                        payment: {
                            mode: "simulated",
                            status: "awaiting_simulation",
                            simulationReference: null,
                            simulatedAt: null,
                            message: "Aguardamos a simulação explícita.",
                        },
                    },
                };
            }
            if (path === "/orders/order-one/payments/simulate") {
                return {
                    order: {
                        id: "order-one",
                        status: "confirmed",
                        subtotalCents: 1_000,
                        discountCents: 0,
                        totalCents: 1_000,
                        voucher: null,
                        payment: {
                            mode: "simulated",
                            status: "simulated_paid",
                            simulationReference: "SIM-ORDER-ONE",
                            simulatedAt: "2026-07-14T12:00:00.000Z",
                            message: "Encomenda confirmada.",
                        },
                    },
                };
            }
            throw new Error(`Pedido inesperado: ${path}`);
        });

        const user = userEvent.setup();
        renderInRouter(<CheckoutPage />);
        expect(
            screen.getByRole("heading", { name: "Confirmar encomenda", level: 1 }),
        ).toBeVisible();

        await user.click(screen.getByRole("button", { name: "Ver vouchers" }));
        expect((await screen.findByText(/VOUCHER-A:/)).closest("li")).toHaveTextContent(
            "Disponível",
        );
        expect(screen.getByText(/VOUCHER-B:/).closest("li")).toHaveTextContent(
            "Estado indisponível",
        );

        await user.click(
            screen.getByRole("button", { name: "Criar resumo da encomenda" }),
        );
        expect(surfaceMocks.apiRequest).toHaveBeenCalledWith(
            "/orders/checkout",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ voucherCode: "VOUCHER-A" }),
            }),
        );
        expect(await screen.findByText(/Estado da encomenda:/)).toHaveTextContent(
            "Estado indisponível",
        );
        expect(screen.queryByText(/internal_future/)).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Confirmar encomenda" }));
        expect(await screen.findByText("Encomenda confirmada.")).toBeVisible();
        expect(surfaceMocks.refreshCart).toHaveBeenCalledTimes(1);
    });

    it("pré-seleciona a variante recomendada e envia a linha exata ao carrinho", async () => {
        surfaceMocks.useAuth.mockReturnValue({
            user: { email: "cliente@example.test", role: "cliente" },
        });
        surfaceMocks.apiRequest.mockImplementation(async (path) => {
            if (path === "/catalog/products/product-public") {
                return {
                    product: {
                        id: "product-public",
                        name: "Base com variantes",
                        brandName: "Orélle",
                        description: "Produto cosmético com cor selecionável.",
                        imageUrl: "/products/base-liquida-mate.png",
                        priceCents: 1_500,
                        stock: 7,
                        ingredientNames: ["pigmentos"],
                        reviewSummary: { averageRating: 4.5, totalReviews: 2 },
                        variants: [
                            {
                                variantId: "light",
                                label: "Claro",
                                imageUrl: "/products/base-liquida-mate.png",
                                priceCents: 1_700,
                                stock: 3,
                            },
                            {
                                variantId: "deep",
                                label: "Escuro",
                                priceCents: 1_800,
                                stock: 4,
                            },
                        ],
                    },
                };
            }
            if (path === "/cart/items") return { cart: { items: [] } };
            throw new Error(`Pedido inesperado: ${path}`);
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter
                initialEntries={[
                    "/produtos/product-public?variant=light",
                ]}
            >
                <Routes>
                    <Route
                        path="/produtos/:productId"
                        element={<ProductDetailsPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole("radio", { name: "Claro" }),
        ).toBeChecked();
        expect(screen.getByText("17.00 EUR")).toBeVisible();
        expect(screen.getByText("Stock: 3")).toBeVisible();
        await user.click(
            screen.getByRole("button", { name: "Adicionar ao carrinho" }),
        );

        await waitFor(() => {
            expect(surfaceMocks.addItem).toHaveBeenCalledWith({
                productId: "product-public",
                variantId: "light",
                quantity: 1,
            });
        });
    });
});
