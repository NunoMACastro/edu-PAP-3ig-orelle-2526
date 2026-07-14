/** Testes comportamentais das superfícies comerciais públicas. */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductDetailsPage } from "../../src/pages/ProductDetailsPage.jsx";
import { ProductSearchPage } from "../../src/pages/ProductSearchPage.jsx";

const commerceMocks = vi.hoisted(() => ({
    apiRequest: vi.fn(),
    useAuth: vi.fn(),
}));

vi.mock("../../src/services/apiClient.js", () => ({
    apiRequest: commerceMocks.apiRequest,
}));

vi.mock("../../src/context/AuthContext.jsx", () => ({
    useAuth: commerceMocks.useAuth,
}));

const PRODUCT = {
    id: "product-one",
    name: "Sérum Orélle",
    brandName: "Orélle",
    description: "Sérum leve para a rotina diária.",
    imageUrl: "/products/serum.png",
    priceCents: 1_590,
    stock: 4,
    skinTypes: ["seca"],
    ingredientNames: ["glicerina"],
    variants: [],
    attributes: {},
    reviewSummary: { averageRating: 0, totalReviews: 0 },
};

function LoginProbe() {
    const location = useLocation();
    return <p>Regresso: {location.state?.from?.pathname ?? "indisponível"}</p>;
}

describe("catálogo comercial", () => {
    beforeEach(() => {
        commerceMocks.apiRequest.mockReset();
        commerceMocks.useAuth.mockReturnValue({ user: null });
        commerceMocks.apiRequest.mockImplementation(async (path) => {
            if (path === "/catalog/categories") {
                return { categories: [{ id: "care", name: "Tratamento" }] };
            }
            if (path.startsWith("/catalog/products")) {
                return { products: [PRODUCT] };
            }
            throw new Error(`Pedido inesperado: ${path}`);
        });
    });

    it("expande filtros, sincroniza pesquisa na URL e permite remover o chip", async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter initialEntries={["/produtos"]}>
                <ProductSearchPage />
            </MemoryRouter>,
        );

        expect(await screen.findByText("1 produto")).toBeVisible();
        const filterToggle = screen.getByRole("button", { name: "Filtrar" });
        expect(filterToggle).toHaveAttribute("aria-expanded", "false");
        await user.click(filterToggle);
        expect(filterToggle).toHaveAttribute("aria-expanded", "true");

        await user.type(screen.getByRole("textbox", { name: "Pesquisa" }), "serum");
        await user.click(screen.getByRole("button", { name: "Pesquisar" }));

        expect(
            await screen.findByRole("button", {
                name: "Remover Pesquisa: serum",
            }),
        ).toBeVisible();
        expect(commerceMocks.apiRequest).toHaveBeenCalledWith(
            "/catalog/products?search=serum",
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );

        await user.click(
            screen.getByRole("button", { name: "Remover Pesquisa: serum" }),
        );
        await waitFor(() => {
            expect(
                screen.queryByRole("button", { name: "Remover Pesquisa: serum" }),
            ).not.toBeInTheDocument();
        });
    });

    it("não repete pedidos de login nos cards de visitante", async () => {
        render(
            <MemoryRouter>
                <ProductSearchPage />
            </MemoryRouter>,
        );

        expect(await screen.findByRole("link", { name: "Ver produto" })).toBeVisible();
        expect(screen.queryByText("Entrar para adicionar")).not.toBeInTheDocument();
    });
});

describe("detalhe comercial", () => {
    beforeEach(() => {
        commerceMocks.apiRequest.mockReset();
        commerceMocks.useAuth.mockReturnValue({ user: null });
    });

    it("mantém o detalhe utilizável quando relacionados falham e preserva o regresso do login", async () => {
        commerceMocks.apiRequest.mockImplementation(async (path) => {
            if (path === "/catalog/products/product-one") {
                return {
                    product: {
                        ...PRODUCT,
                        attributes: { texture: "future_texture", fragranceFree: true },
                    },
                };
            }
            if (path === "/catalog/products/product-one/related") {
                throw new Error("Relacionados indisponíveis");
            }
            throw new Error(`Pedido inesperado: ${path}`);
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={["/produtos/product-one"]}>
                <Routes>
                    <Route
                        path="/produtos/:productId"
                        element={<ProductDetailsPage />}
                    />
                    <Route path="/login" element={<LoginProbe />} />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole("heading", { name: PRODUCT.name, level: 1 }),
        ).toBeVisible();
        expect(screen.getByText("Ainda sem avaliações")).toBeVisible();
        expect(screen.getByText("Textura indisponível")).toBeVisible();
        expect(screen.getByText("Sem fragrância")).toBeVisible();
        expect(
            await screen.findByText(/Não foi possível carregar as sugestões/),
        ).toBeVisible();

        await user.click(screen.getByRole("link", { name: "Entrar para comprar" }));
        expect(screen.getByText("Regresso: /produtos/product-one")).toBeVisible();
    });

    it("limita a montra inline a três relacionados", async () => {
        commerceMocks.apiRequest.mockImplementation(async (path) => {
            if (path === "/catalog/products/product-one") {
                return { product: PRODUCT };
            }
            if (path === "/catalog/products/product-one/related") {
                return {
                    products: Array.from({ length: 4 }, (_, index) => ({
                        ...PRODUCT,
                        id: `related-${index}`,
                        name: `Relacionado ${index + 1}`,
                    })),
                };
            }
            throw new Error(`Pedido inesperado: ${path}`);
        });
        const { container } = render(
            <MemoryRouter initialEntries={["/produtos/product-one"]}>
                <Routes>
                    <Route
                        path="/produtos/:productId"
                        element={<ProductDetailsPage />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        expect(await screen.findByRole("link", { name: "Ver todos" })).toBeVisible();
        expect(
            container.querySelectorAll(".related-products-grid .product-card"),
        ).toHaveLength(3);
        expect(screen.queryByText("Relacionado 4")).not.toBeInTheDocument();
    });
});
