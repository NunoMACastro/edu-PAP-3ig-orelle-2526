/** Teste comportamental do workflow de curadoria do catálogo. */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { AdminProductsPage } from "../../src/pages/AdminProductsPage.jsx";

const serviceMock = vi.hoisted(() => ({
    listProductsForAiCuration: vi.fn(),
    saveProductAiCuration: vi.fn(),
}));

vi.mock("../../src/services/productAiCuration.js", async (importOriginal) => ({
    ...(await importOriginal()),
    listProductsForAiCuration: serviceMock.listProductsForAiCuration,
    saveProductAiCuration: serviceMock.saveProductAiCuration,
}));

const PRODUCT = {
    id: "internal-product-id",
    name: "Creme barreira",
    brandName: "Orélle",
    stock: 10,
    aiEligible: false,
    concernTags: [],
    routineSteps: [],
    inciIngredients: ["aqua", "glycerin"],
    attributes: {},
    variants: [],
};

beforeEach(() => {
    serviceMock.listProductsForAiCuration.mockReset().mockResolvedValue({
        products: [PRODUCT],
        pagination: {
            page: 1,
            pageSize: 20,
            total: 1,
            totalPages: 1,
        },
    });
    serviceMock.saveProductAiCuration.mockReset().mockResolvedValue({
        ...PRODUCT,
        aiEligible: true,
        concernTags: ["hydration_barrier"],
        routineSteps: ["moisturize"],
    });
});

it("navega entre páginas através do contrato remoto", async () => {
    serviceMock.listProductsForAiCuration
        .mockResolvedValueOnce({
            products: [PRODUCT],
            pagination: {
                page: 1,
                pageSize: 20,
                total: 21,
                totalPages: 2,
            },
        })
        .mockResolvedValueOnce({
            products: [{ ...PRODUCT, id: "page-two", name: "Sérum calmante" }],
            pagination: {
                page: 2,
                pageSize: 20,
                total: 21,
                totalPages: 2,
            },
        });
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <AdminProductsPage />
        </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Seguinte" }));

    expect(await screen.findByText("Sérum calmante")).toBeVisible();
    expect(serviceMock.listProductsForAiCuration).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, pageSize: 20 }),
        { signal: expect.any(AbortSignal) },
    );
});

it("abre a curadoria da linha e guarda metadata sem pedir identificadores", async () => {
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <AdminProductsPage />
        </MemoryRouter>,
    );

    await user.click(
        await screen.findByRole("button", {
            name: "Editar curadoria de Creme barreira",
        }),
    );
    expect(screen.getByRole("dialog", { name: "Editar Creme barreira" })).toBeVisible();
    expect(screen.queryByLabelText(/identificador/i)).not.toBeInTheDocument();
    await user.click(
        screen.getByRole("checkbox", {
            name: "Produto elegível para recomendações da consulta",
        }),
    );
    await user.click(
        screen.getByRole("checkbox", { name: "Hidratação e barreira" }),
    );
    await user.click(screen.getByRole("checkbox", { name: "Hidratação" }));
    await user.click(screen.getByRole("button", { name: "Guardar curadoria" }));

    await waitFor(() => {
        expect(serviceMock.saveProductAiCuration).toHaveBeenCalledWith(
            "internal-product-id",
            expect.objectContaining({
                aiEligible: true,
                concernTags: ["hydration_barrier"],
                routineSteps: ["moisturize"],
            }),
            { signal: expect.any(AbortSignal) },
        );
    });
    expect(
        await screen.findByText(/Curadoria guardada/),
    ).toBeVisible();
});
