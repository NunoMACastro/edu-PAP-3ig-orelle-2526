/** Testes do aviso efémero apresentado depois de uma sessão terminal. */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../../src/pages/LoginPage.jsx";

const authMock = vi.hoisted(() => ({
    useAuth: vi.fn(),
}));

vi.mock("../../src/context/AuthContext.jsx", () => ({
    useAuth: authMock.useAuth,
}));

function LateRouteStateHarness() {
    const navigate = useNavigate();

    return (
        <>
            <button
                type="button"
                onClick={() =>
                    navigate("/login", {
                        state: { accountDeletedMessage: "Conta eliminada pela API." },
                    })
                }
            >
                Atualizar aviso
            </button>
            <LoginPage />
        </>
    );
}

function renderWithRouter(children) {
    return render(
        <MemoryRouter
            initialEntries={["/login"]}
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            {children}
        </MemoryRouter>,
    );
}

describe("LoginPage post-session notice", () => {
    beforeEach(() => {
        authMock.useAuth.mockReturnValue({
            login: vi.fn(),
            logout: vi.fn(),
            logoutAll: vi.fn(),
            user: null,
            postSessionNotice: "",
            clearPostSessionNotice: vi.fn(),
        });
    });

    it("materializa e consome o aviso efémero do contexto", async () => {
        const clearPostSessionNotice = vi.fn();
        authMock.useAuth.mockReturnValue({
            login: vi.fn(),
            logout: vi.fn(),
            logoutAll: vi.fn(),
            user: null,
            postSessionNotice: "Conta eliminada de forma terminal.",
            clearPostSessionNotice,
        });

        renderWithRouter(<LoginPage />);

        expect(screen.getByRole("status")).toHaveTextContent("Conta eliminada");
        await waitFor(() => {
            expect(clearPostSessionNotice).toHaveBeenCalledOnce();
        });
    });

    it("acompanha route state que chega depois de o login montar", async () => {
        const user = userEvent.setup();
        renderWithRouter(<LateRouteStateHarness />);

        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Atualizar aviso" }));

        expect(await screen.findByRole("status")).toHaveTextContent(
            "Conta eliminada pela API.",
        );
    });

    it("usa autocomplete e permite mostrar ou ocultar a palavra-passe", async () => {
        const user = userEvent.setup();
        renderWithRouter(<LoginPage />);

        const email = screen.getByLabelText("Email");
        const password = screen.getByLabelText("Palavra-passe");
        expect(email).toHaveAttribute("autocomplete", "email");
        expect(password).toHaveAttribute("autocomplete", "current-password");
        expect(password).toHaveAttribute("type", "password");

        await user.click(
            screen.getByRole("button", { name: "Mostrar palavra-passe" }),
        );
        expect(password).toHaveAttribute("type", "text");
        await user.click(
            screen.getByRole("button", { name: "Ocultar palavra-passe" }),
        );
        expect(password).toHaveAttribute("type", "password");
    });

    it("autentica e encaminha a role para o destino seguro", async () => {
        const login = vi.fn().mockResolvedValue({
            email: "cliente@example.test",
            role: "cliente",
        });
        authMock.useAuth.mockReturnValue({
            login,
            logout: vi.fn(),
            logoutAll: vi.fn(),
            user: null,
            postSessionNotice: "",
            clearPostSessionNotice: vi.fn(),
        });
        const user = userEvent.setup();

        render(
            <MemoryRouter
                initialEntries={["/login"]}
                future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/conta" element={<p>Destino da conta</p>} />
                </Routes>
            </MemoryRouter>,
        );

        await user.type(screen.getByLabelText("Email"), "cliente@example.test");
        await user.type(screen.getByLabelText("Palavra-passe"), "Segura123");
        await user.click(screen.getByRole("button", { name: "Entrar" }));

        expect(await screen.findByText("Destino da conta")).toBeVisible();
        expect(login).toHaveBeenCalledWith({
            email: "cliente@example.test",
            password: "Segura123",
        });
    });

    it("apresenta falhas de login sem expor detalhes adicionais", async () => {
        const login = vi.fn().mockRejectedValue(new Error("Credenciais inválidas"));
        authMock.useAuth.mockReturnValue({
            login,
            logout: vi.fn(),
            logoutAll: vi.fn(),
            user: null,
            postSessionNotice: "",
            clearPostSessionNotice: vi.fn(),
        });
        const user = userEvent.setup();
        renderWithRouter(<LoginPage />);

        await user.type(screen.getByLabelText("Email"), "cliente@example.test");
        await user.type(screen.getByLabelText("Palavra-passe"), "Errada123");
        await user.click(screen.getByRole("button", { name: "Entrar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Credenciais inválidas",
        );
        expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
    });

    it("apresenta a falha de logout sem perder a sessão visível", async () => {
        const logout = vi.fn().mockRejectedValue(new Error("Serviço indisponível"));
        authMock.useAuth.mockReturnValue({
            login: vi.fn(),
            logout,
            logoutAll: vi.fn(),
            user: { email: "cliente@example.test" },
            postSessionNotice: "",
            clearPostSessionNotice: vi.fn(),
        });

        const user = userEvent.setup();
        renderWithRouter(<LoginPage />);
        await user.click(screen.getByRole("button", { name: "Terminar sessão" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Serviço indisponível",
        );
        expect(screen.getByText("Autenticado como cliente@example.test")).toBeVisible();
        expect(logout).toHaveBeenCalledOnce();
    });

    it("usa um latch síncrono e revoga todas as sessões uma única vez", async () => {
        let resolveLogoutAll;
        const logoutAll = vi.fn(
            () =>
                new Promise((resolve) => {
                    resolveLogoutAll = resolve;
                }),
        );
        authMock.useAuth.mockReturnValue({
            login: vi.fn(),
            logout: vi.fn(),
            logoutAll,
            user: { email: "cliente@example.test" },
            postSessionNotice: "",
            clearPostSessionNotice: vi.fn(),
        });

        renderWithRouter(<LoginPage />);
        const button = screen.getByRole("button", {
            name: "Terminar sessões em todos os dispositivos",
        });
        act(() => {
            button.click();
            button.click();
        });

        expect(logoutAll).toHaveBeenCalledOnce();
        expect(button).toHaveTextContent("A terminar sessões...");

        await act(async () => {
            resolveLogoutAll();
        });
        expect(screen.getByRole("status")).toHaveTextContent(
            "Todas as sessões foram terminadas.",
        );
    });
});
