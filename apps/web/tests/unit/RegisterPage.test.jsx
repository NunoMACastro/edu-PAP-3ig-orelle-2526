/** Testes do formulário público de criação de conta. */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterPage } from "../../src/pages/RegisterPage.jsx";

const apiMock = vi.hoisted(() => ({
    apiRequest: vi.fn(),
}));

vi.mock("../../src/services/apiClient.js", () => ({
    apiRequest: apiMock.apiRequest,
}));

function renderPage() {
    return render(
        <MemoryRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
            <RegisterPage />
        </MemoryRouter>,
    );
}

describe("RegisterPage", () => {
    beforeEach(() => {
        apiMock.apiRequest.mockReset();
    });

    it("cria a conta, limpa os campos e mantém o acesso ao login", async () => {
        apiMock.apiRequest.mockResolvedValue({ ok: true });
        const user = userEvent.setup();
        renderPage();

        const email = screen.getByLabelText("Email");
        const password = screen.getByLabelText("Palavra-passe");
        expect(email).toHaveAttribute("autocomplete", "email");
        expect(password).toHaveAttribute("autocomplete", "new-password");

        await user.type(email, "nova@example.test");
        await user.type(password, "Segura123");
        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        expect(await screen.findByRole("status")).toHaveTextContent(
            "Conta criada",
        );
        expect(email).toHaveValue("");
        expect(password).toHaveValue("");
        expect(screen.getByRole("link", { name: "Iniciar sessão" })).toHaveAttribute(
            "href",
            "/login",
        );
        expect(apiMock.apiRequest).toHaveBeenCalledWith("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                email: "nova@example.test",
                password: "Segura123",
            }),
        });
    });

    it("mostra o erro e volta a disponibilizar a submissão", async () => {
        apiMock.apiRequest.mockRejectedValue(new Error("Registo indisponível"));
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText("Email"), "nova@example.test");
        await user.type(screen.getByLabelText("Palavra-passe"), "Segura123");
        await user.click(screen.getByRole("button", { name: "Criar conta" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Registo indisponível",
        );
        expect(screen.getByRole("button", { name: "Criar conta" })).toBeEnabled();
    });
});
