/** Testes comportamentais do carrinho global e do respetivo drawer modal. */
import { useState } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartDrawer } from "../../src/components/CartDrawer.jsx";
import { CartLegacyRoute } from "../../src/components/CartLegacyRoute.jsx";
import {
    CartProvider,
    useCart,
} from "../../src/context/CartContext.jsx";

const cartMocks = vi.hoisted(() => ({
    user: null,
    getCart: vi.fn(),
    addCartItem: vi.fn(),
    updateCartItem: vi.fn(),
    deleteCartItem: vi.fn(),
}));

vi.mock("../../src/context/AuthContext.jsx", () => ({
    useAuth: () => ({ user: cartMocks.user }),
}));

vi.mock("../../src/services/cartApi.js", () => ({
    getCart: cartMocks.getCart,
    addCartItem: cartMocks.addCartItem,
    updateCartItem: cartMocks.updateCartItem,
    deleteCartItem: cartMocks.deleteCartItem,
}));

const EMPTY_CART = { items: [], totalCents: 0 };
const PRODUCT_LINE = {
    productId: "product-one",
    variantId: "rose",
    name: "Batom Rosa",
    variant: { label: "Rosa suave", imageUrl: "/products/rose.webp" },
    priceSnapshotCents: 1_250,
    quantity: 1,
    lineTotalCents: 1_250,
};

/** Monta controlos de teste em cima do mesmo provider usado pela aplicação. */
function CartHarness() {
    const cart = useCart();
    const [showTrigger, setShowTrigger] = useState(true);

    return (
        <>
            {showTrigger ? (
                <button type="button" onClick={cart.openCart}>
                    Abrir carrinho de teste
                </button>
            ) : null}
            <output aria-label="Total de unidades">{cart.itemCount}</output>
            <button
                type="button"
                onClick={() =>
                    void cart
                        .addItem({
                            productId: PRODUCT_LINE.productId,
                            variantId: PRODUCT_LINE.variantId,
                            quantity: 1,
                        })
                        .catch(() => undefined)
                }
            >
                Adicionar produto de teste
            </button>
            <button
                type="button"
                onClick={() =>
                    void cart
                        .addLines([
                            { productId: "product-one", quantity: 1 },
                            { productId: "product-two", quantity: 1 },
                        ])
                        .catch(() => undefined)
                }
            >
                Adicionar conjunto de teste
            </button>
            <button type="button" onClick={() => setShowTrigger(false)}>
                Remover trigger auxiliar
            </button>
            {cart.isOpen ? <CartDrawer /> : null}
        </>
    );
}

/** Renderiza o provider com router, tal como acontece na raiz da aplicação. */
function renderCart() {
    return render(
        <MemoryRouter>
            <CartProvider>
                <CartHarness />
            </CartProvider>
        </MemoryRouter>,
    );
}

/** Expõe a navegação e a abertura do drawer durante a compatibilidade legacy. */
function LegacyRouteHarness() {
    const cart = useCart();
    const location = useLocation();

    return (
        <>
            <output aria-label="Rota atual">{location.pathname}</output>
            <output aria-label="Estado do drawer">
                {cart.isOpen ? "aberto" : "fechado"}
            </output>
            <Routes>
                <Route path="/carrinho" element={<CartLegacyRoute />} />
                <Route path="/produtos" element={<p>Catálogo de destino</p>} />
            </Routes>
        </>
    );
}

describe("CartProvider e CartDrawer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cartMocks.user = {
            id: "client-one",
            email: "cliente@orelle.test",
            role: "cliente",
        };
        cartMocks.getCart.mockResolvedValue(EMPTY_CART);
    });

    it("carrega uma vez para cliente e não carrega para outros perfis", async () => {
        const { unmount } = renderCart();
        await waitFor(() => expect(cartMocks.getCart).toHaveBeenCalledTimes(1));
        unmount();

        vi.clearAllMocks();
        cartMocks.user = { id: "admin-one", role: "administrador" };
        renderCart();
        await Promise.resolve();
        expect(cartMocks.getCart).not.toHaveBeenCalled();
    });

    it("abre após adicionar, usa o DTO confirmado e restaura o foco com Escape", async () => {
        cartMocks.addCartItem.mockResolvedValue({
            items: [PRODUCT_LINE],
            totalCents: 1_250,
        });
        const user = userEvent.setup();
        renderCart();
        await waitFor(() => expect(cartMocks.getCart).toHaveBeenCalledTimes(1));

        const addButton = screen.getByRole("button", {
            name: "Adicionar produto de teste",
        });
        addButton.focus();
        await user.click(addButton);

        const drawer = await screen.findByRole("dialog", { name: "Carrinho" });
        expect(within(drawer).getByText("Batom Rosa")).toBeVisible();
        expect(within(drawer).getAllByText(/12,50/).length).toBeGreaterThan(0);
        expect(
            within(drawer).getByRole("button", { name: "Fechar" }),
        ).toHaveFocus();
        expect(cartMocks.addCartItem).toHaveBeenCalledWith(
            {
                productId: "product-one",
                variantId: "rose",
                quantity: 1,
            },
            { signal: expect.any(AbortSignal) },
        );

        fireEvent(
            drawer,
            new Event("cancel", { bubbles: false, cancelable: true }),
        );
        await waitFor(() =>
            expect(screen.queryByRole("dialog", { name: "Carrinho" }))
                .not.toBeInTheDocument(),
        );
        expect(addButton).toHaveFocus();
    });

    it("mantém o sucesso parcial quando uma linha do bulk falha", async () => {
        cartMocks.addCartItem
            .mockResolvedValueOnce({
                items: [{ ...PRODUCT_LINE, variantId: null, variant: null }],
                totalCents: 1_250,
            })
            .mockRejectedValueOnce(new Error("Produto sem stock."));
        const user = userEvent.setup();
        renderCart();
        await waitFor(() => expect(cartMocks.getCart).toHaveBeenCalledTimes(1));

        await user.click(
            screen.getByRole("button", { name: "Adicionar conjunto de teste" }),
        );

        const drawer = await screen.findByRole("dialog", { name: "Carrinho" });
        expect(within(drawer).getByText("1 de 2 adicionados.")).toBeVisible();
        expect(within(drawer).getByText("Batom Rosa")).toBeVisible();
        expect(within(drawer).getByText("Produto sem stock.")).toBeVisible();
    });

    it("não deixa um bootstrap tardio substituir uma mutação confirmada", async () => {
        let resolveBootstrap;
        cartMocks.getCart.mockReturnValue(
            new Promise((resolve) => {
                resolveBootstrap = resolve;
            }),
        );
        cartMocks.addCartItem.mockResolvedValue({
            items: [PRODUCT_LINE],
            totalCents: 1_250,
        });
        const user = userEvent.setup();
        renderCart();
        await waitFor(() => expect(cartMocks.getCart).toHaveBeenCalledTimes(1));

        await user.click(
            screen.getByRole("button", { name: "Adicionar produto de teste" }),
        );
        await waitFor(() =>
            expect(screen.getByLabelText("Total de unidades")).toHaveTextContent("1"),
        );

        await act(async () => resolveBootstrap(EMPTY_CART));
        expect(screen.getByLabelText("Total de unidades")).toHaveTextContent("1");
    });

    it("atualiza quantidade e remove apenas com o DTO devolvido pela API", async () => {
        cartMocks.getCart.mockResolvedValue({
            items: [PRODUCT_LINE],
            totalCents: 1_250,
        });
        cartMocks.updateCartItem.mockResolvedValue({
            items: [{ ...PRODUCT_LINE, quantity: 2, lineTotalCents: 2_500 }],
            totalCents: 2_500,
        });
        cartMocks.deleteCartItem.mockResolvedValue(EMPTY_CART);
        const user = userEvent.setup();
        renderCart();
        await waitFor(() =>
            expect(screen.getByLabelText("Total de unidades")).toHaveTextContent("1"),
        );

        await user.click(
            screen.getByRole("button", { name: "Abrir carrinho de teste" }),
        );
        await user.click(
            await screen.findByRole("button", {
                name: "Aumentar quantidade de Batom Rosa, variante Rosa suave",
            }),
        );
        await waitFor(() => {
            expect(cartMocks.updateCartItem).toHaveBeenCalledWith(
                "product-one",
                "rose",
                2,
                { signal: expect.any(AbortSignal) },
            );
            expect(screen.getByLabelText("Total de unidades")).toHaveTextContent("2");
        });

        await user.click(
            screen.getByRole("button", {
                name: "Remover Batom Rosa, variante Rosa suave do carrinho",
            }),
        );
        await waitFor(() => {
            expect(cartMocks.deleteCartItem).toHaveBeenCalledWith(
                "product-one",
                "rose",
                { signal: expect.any(AbortSignal) },
            );
            expect(screen.getByText("O carrinho está vazio")).toBeVisible();
        });
    });

    it("apresenta 99+ sem perder a contagem real acessível", async () => {
        cartMocks.getCart.mockResolvedValue({
            items: [{ ...PRODUCT_LINE, quantity: 105, lineTotalCents: 131_250 }],
            totalCents: 131_250,
        });
        const user = userEvent.setup();
        renderCart();
        await waitFor(() =>
            expect(screen.getByLabelText("Total de unidades")).toHaveTextContent("105"),
        );

        await user.click(
            screen.getByRole("button", { name: "Abrir carrinho de teste" }),
        );
        const drawer = await screen.findByRole("dialog", { name: "Carrinho" });
        expect(within(drawer).getByLabelText("105 unidades")).toHaveTextContent(
            "99+",
        );
    });

    it("mantém o voucher em memória ao fechar e reabrir o drawer", async () => {
        cartMocks.getCart.mockResolvedValue({
            items: [PRODUCT_LINE],
            totalCents: 1_250,
        });
        const user = userEvent.setup();
        renderCart();
        await waitFor(() =>
            expect(screen.getByLabelText("Total de unidades")).toHaveTextContent("1"),
        );

        await user.click(
            screen.getByRole("button", { name: "Abrir carrinho de teste" }),
        );
        const voucherInput = await screen.findByRole("textbox", {
            name: "Voucher",
        });
        await user.type(voucherInput, "orelle-ab76a7b3");
        expect(voucherInput).toHaveValue("ORELLE-AB76A7B3");

        await user.click(screen.getByRole("button", { name: "Fechar" }));
        await user.click(
            screen.getByRole("button", { name: "Abrir carrinho de teste" }),
        );
        expect(
            await screen.findByRole("textbox", { name: "Voucher" }),
        ).toHaveValue("ORELLE-AB76A7B3");
    });

    it("limpa e fecha o carrinho quando muda a sessão", async () => {
        cartMocks.getCart.mockResolvedValue({
            items: [PRODUCT_LINE],
            totalCents: 1_250,
        });
        const user = userEvent.setup();
        const rendered = renderCart();
        await waitFor(() =>
            expect(screen.getByLabelText("Total de unidades")).toHaveTextContent("1"),
        );
        await user.click(
            screen.getByRole("button", { name: "Abrir carrinho de teste" }),
        );
        expect(await screen.findByRole("dialog", { name: "Carrinho" })).toBeVisible();

        cartMocks.user = null;
        rendered.rerender(
            <MemoryRouter>
                <CartProvider>
                    <CartHarness />
                </CartProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByLabelText("Total de unidades")).toHaveTextContent("0");
            expect(screen.queryByRole("dialog", { name: "Carrinho" }))
                .not.toBeInTheDocument();
        });
    });

    it("abre o drawer e substitui a rota legacy pelo catálogo", async () => {
        render(
            <MemoryRouter initialEntries={["/carrinho"]}>
                <CartProvider>
                    <LegacyRouteHarness />
                </CartProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByLabelText("Rota atual")).toHaveTextContent(
                "/produtos",
            );
            expect(screen.getByLabelText("Estado do drawer")).toHaveTextContent(
                "aberto",
            );
        });
        expect(screen.getByText("Catálogo de destino")).toBeVisible();
    });
});
