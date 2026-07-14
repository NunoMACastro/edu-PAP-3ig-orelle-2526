/** Testes do estado e das mutações administrativas de categorias. */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminCategoriesPage } from "../../src/pages/AdminCategoriesPage.jsx";

const apiMock = vi.hoisted(() => ({
    apiRequest: vi.fn(),
}));

vi.mock("../../src/services/apiClient.js", () => ({
    apiRequest: apiMock.apiRequest,
}));

const INITIAL_CATEGORIES = Object.freeze([
    { id: "category-clean", name: "Limpeza" },
    { id: "category-hydration", name: "Hidratação" },
]);
const INITIAL_PRODUCTS = Object.freeze([
    {
        id: "product-one",
        name: "Produto A",
        categoryIds: ["category-clean"],
    },
]);

describe("AdminCategoriesPage", () => {
    beforeEach(() => {
        apiMock.apiRequest.mockReset();
    });

    it("permite remover todas as associações sem pedir identificadores", async () => {
        apiMock.apiRequest.mockImplementation(async (path, options = {}) => {
            if (path === "/admin/categories" && !options.method) {
                return { categories: INITIAL_CATEGORIES };
            }
            if (path === "/catalog/products") {
                return { products: INITIAL_PRODUCTS };
            }
            if (
                path === "/admin/products/product-one/categories" &&
                options.method === "PATCH"
            ) {
                return {
                    product: { ...INITIAL_PRODUCTS[0], categoryIds: [] },
                };
            }
            throw new Error(`Pedido inesperado: ${path}`);
        });

        const user = userEvent.setup();
        render(<AdminCategoriesPage />);

        const cleanCategory = await screen.findByRole("checkbox", {
            name: "Limpeza",
        });
        expect(cleanCategory).toBeChecked();
        await user.click(cleanCategory);
        expect(
            screen.getByText(/as associações atuais serão removidas/),
        ).toBeVisible();
        await user.click(
            screen.getByRole("button", { name: "Guardar associações" }),
        );

        await waitFor(() => {
            expect(apiMock.apiRequest).toHaveBeenCalledWith(
                "/admin/products/product-one/categories",
                expect.objectContaining({
                    method: "PATCH",
                    body: JSON.stringify({ categoryIds: [] }),
                }),
            );
        });
        expect(screen.getByRole("status")).toHaveTextContent(
            "Associações atualizadas.",
        );
    });

    it("mantém uma categoria criada quando apenas o refresh posterior falha", async () => {
        let categoryReadCount = 0;
        apiMock.apiRequest.mockImplementation(async (path, options = {}) => {
            if (path === "/admin/categories" && !options.method) {
                categoryReadCount += 1;
                if (categoryReadCount > 1) {
                    throw new Error("Ligação indisponível no refresh");
                }
                return { categories: INITIAL_CATEGORIES };
            }
            if (path === "/catalog/products") {
                return { products: INITIAL_PRODUCTS };
            }
            if (path === "/admin/categories" && options.method === "POST") {
                return {
                    category: { id: "category-new", name: "Nova categoria" },
                };
            }
            throw new Error(`Pedido inesperado: ${path}`);
        });

        const user = userEvent.setup();
        render(<AdminCategoriesPage />);
        const createHeading = await screen.findByRole("heading", {
            name: "Criar categoria",
        });
        const createForm = createHeading.closest("form");
        const form = within(createForm);

        await user.clear(form.getByLabelText("Nome da categoria"));
        await user.type(form.getByLabelText("Nome da categoria"), "Nova categoria");
        await user.click(form.getByRole("button", { name: "Criar categoria" }));

        const existingCategories = screen
            .getByRole("heading", { name: "Categorias existentes" })
            .closest("section");
        await waitFor(() => {
            expect(
                within(existingCategories).getByText("Nova categoria"),
            ).toBeVisible();
        });
        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Ligação indisponível no refresh",
        );
        expect(form.getByRole("status")).toHaveTextContent("Categoria criada");
    });
});
