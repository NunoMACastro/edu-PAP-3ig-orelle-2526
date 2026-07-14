/**
 * Testes comportamentais do fluxo recorrente de perfil.
 */
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
    apiRequestMock: vi.fn(),
}));

vi.mock("../../src/services/apiClient.js", () => ({
    apiRequest: apiRequestMock,
}));

import { ProfileSetupPage } from "../../src/pages/ProfileSetupPage.jsx";

const EXISTING_PROFILE = Object.freeze({
    nome: "Ana Silva",
    idade: 29,
    tipoDePele: "mista",
    genero: "feminino",
    objetivos: ["hidratar"],
    allergies: [],
    avoidIngredients: [],
    lightMedicalRestrictions: [],
});

/**
 * Renderiza a página com o router e, opcionalmente, o contexto de retorno.
 *
 * @param {string|null} returnTo - Rota segura para retomar o fluxo anterior.
 * @returns {import("@testing-library/react").RenderResult} Resultado do render.
 */
function renderProfilePage(returnTo = null) {
    return render(
        <MemoryRouter
            initialEntries={[
                {
                    pathname: "/conta/perfil",
                    state: returnTo ? { returnTo } : null,
                },
            ]}
            future={{
                v7_relativeSplatPath: true,
                v7_startTransition: true,
            }}
        >
            <ProfileSetupPage />
        </MemoryRouter>,
    );
}

describe("ProfileSetupPage", () => {
    beforeEach(() => {
        apiRequestMock.mockReset();
    });

    it("usa POST apenas depois de o GET devolver 404", async () => {
        const user = userEvent.setup();
        const notFound = Object.assign(new Error("Perfil inexistente"), {
            status: 404,
        });
        const createdProfile = { ...EXISTING_PROFILE, nome: "Maria Costa" };
        apiRequestMock
            .mockRejectedValueOnce(notFound)
            .mockResolvedValueOnce({ profile: createdProfile });

        renderProfilePage();

        expect(
            await screen.findByRole("heading", { name: "Criar perfil" }),
        ).toBeInTheDocument();
        await user.type(screen.getByRole("textbox", { name: "Nome" }), "Maria Costa");
        await user.type(screen.getByRole("spinbutton", { name: "Idade" }), "29");
        await user.click(screen.getByRole("button", { name: "Criar perfil" }));

        await waitFor(() => expect(apiRequestMock).toHaveBeenCalledTimes(2));
        expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/profile/me", {
            signal: expect.any(AbortSignal),
        });
        expect(apiRequestMock).toHaveBeenNthCalledWith(
            2,
            "/profile/me",
            expect.objectContaining({ method: "POST" }),
        );
        expect(await screen.findByText("Perfil criado com sucesso.")).toBeVisible();
    });

    it("mostra o resumo existente e guarda alterações por PUT", async () => {
        const user = userEvent.setup();
        const updatedProfile = { ...EXISTING_PROFILE, nome: "Ana Costa" };
        apiRequestMock
            .mockResolvedValueOnce({ profile: EXISTING_PROFILE })
            .mockResolvedValueOnce({ profile: updatedProfile });

        renderProfilePage();

        expect(await screen.findByText("Resumo atual")).toBeVisible();
        const nameInput = screen.getByRole("textbox", { name: "Nome" });
        await user.clear(nameInput);
        await user.type(nameInput, "Ana Costa");
        await user.click(
            screen.getByRole("button", { name: "Guardar alterações" }),
        );

        await waitFor(() => expect(apiRequestMock).toHaveBeenCalledTimes(2));
        expect(apiRequestMock).toHaveBeenNthCalledWith(
            2,
            "/profile/me",
            expect.objectContaining({ method: "PUT" }),
        );
        expect(await screen.findByText("Perfil atualizado com sucesso.")).toBeVisible();
    });

    it("permite retomar a consulta depois de atualizar o perfil", async () => {
        const user = userEvent.setup();
        apiRequestMock
            .mockResolvedValueOnce({ profile: EXISTING_PROFILE })
            .mockResolvedValueOnce({ profile: EXISTING_PROFILE });

        renderProfilePage("/consulta/ativa");

        await user.click(
            await screen.findByRole("button", { name: "Guardar alterações" }),
        );

        const resumeLink = await screen.findByRole("link", {
            name: "Retomar consulta",
        });
        expect(resumeLink).toHaveAttribute("href", "/consulta/ativa");
    });
});
