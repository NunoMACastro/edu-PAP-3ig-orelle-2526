/**
 * Testes comportamentais da página de preferências do cliente.
 *
 * A seleção continua a usar identificadores apenas no payload, enquanto a
 * interface apresenta nomes, marcas e estados compreensíveis.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
    apiRequestMock: vi.fn(),
}));

vi.mock("../../src/services/apiClient.js", () => ({
    apiRequest: apiRequestMock,
}));

import { PreferencesPage } from "../../src/pages/PreferencesPage.jsx";

const PRODUCTS = [
    {
        id: "product-serum",
        name: "Sérum Barreira",
        brandName: "Orélle",
        imageUrl: "",
    },
    {
        id: "product-cleanser",
        name: "Limpador Suave",
        brandName: "Orélle",
        imageUrl: "",
    },
];

describe("PreferencesPage", () => {
    beforeEach(() => {
        apiRequestMock.mockReset();
        apiRequestMock.mockImplementation((path, options = {}) => {
            if (path === "/preferences/me" && options.method === "PUT") {
                return Promise.resolve({ preferences: {} });
            }
            if (path === "/preferences/me") {
                return Promise.resolve({
                    preferences: {
                        favoriteBrandNames: ["Orélle"],
                        favoriteProductIds: [],
                    },
                });
            }
            if (path === "/catalog/products") {
                return Promise.resolve({ products: PRODUCTS });
            }
            return Promise.reject(new Error(`Pedido inesperado: ${path}`));
        });
    });

    it("seleciona produtos pelo nome e guarda o payload esperado", async () => {
        const user = userEvent.setup();
        render(<PreferencesPage />);

        const serum = await screen.findByRole("checkbox", {
            name: /Sérum Barreira/i,
        });
        expect(serum).not.toBeChecked();

        await user.click(serum);
        expect(serum).toBeChecked();
        expect(screen.getByText(/1 produto selecionado\./)).toBeVisible();

        await user.click(
            screen.getByRole("button", { name: "Guardar preferências" }),
        );

        await waitFor(() => {
            expect(apiRequestMock).toHaveBeenCalledWith(
                "/preferences/me",
                expect.objectContaining({
                    method: "PUT",
                    body: JSON.stringify({
                        favoriteBrandNames: ["Orélle"],
                        favoriteProductIds: ["product-serum"],
                    }),
                }),
            );
        });
        expect(
            await screen.findByText("Preferências guardadas com sucesso."),
        ).toBeVisible();
    });

    it("filtra os cartões por nome ou marca", async () => {
        const user = userEvent.setup();
        render(<PreferencesPage />);

        const search = await screen.findByRole("searchbox", {
            name: "Pesquisar produtos",
        });
        await user.type(search, "limpador");

        expect(
            screen.getByRole("checkbox", { name: /Limpador Suave/i }),
        ).toBeVisible();
        expect(
            screen.queryByRole("checkbox", { name: /Sérum Barreira/i }),
        ).not.toBeInTheDocument();
        expect(screen.getByText("1 resultado")).toBeVisible();
    });
});
