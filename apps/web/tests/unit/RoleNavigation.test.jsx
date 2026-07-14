/**
 * Testes comportamentais da navegação autenticada progressiva.
 *
 * A suite cobre o accordion do cliente, a apresentação estática das restantes
 * roles e a consolidação dos destinos pessoais no menu do avatar.
 */
import { useLocation, useNavigate } from "react-router-dom";
import {
    MemoryRouter,
    Route,
    Routes,
} from "react-router-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const layoutMocks = vi.hoisted(() => ({
    getCurrentConsultationSession: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
}));

vi.mock("../../src/context/AuthContext.jsx", () => ({
    useAuth: () => ({
        user: { email: "cliente@example.test", role: "cliente" },
        logout: layoutMocks.logout,
        logoutAll: layoutMocks.logoutAll,
    }),
}));

vi.mock("../../src/context/ConsultationAvailabilityContext.jsx", () => ({
    useConsultationAvailability: () => ({
        status: "success",
        available: true,
    }),
}));

vi.mock("../../src/features/consultation/consultationApi.js", () => ({
    getCurrentConsultationSession: layoutMocks.getCurrentConsultationSession,
}));

import { ClientLayout } from "../../src/components/AppLayouts.jsx";
import { RoleNavigation } from "../../src/components/RoleNavigation.jsx";
import { getRoleNavigation } from "../../src/services/roleAppNavigation.js";

/** Renderiza a navegação pura e permite alterar a rota sem desmontar o teste. */
function NavigationHarness() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <>
            <button type="button" onClick={() => navigate("/rotina")}>Abrir rotina</button>
            <RoleNavigation
                navigation={getRoleNavigation("cliente")}
                pathname={location.pathname}
            />
        </>
    );
}

/** Expõe a rota atual dentro do Outlet do layout autenticado. */
function LocationProbe() {
    const location = useLocation();
    return <p>Rota atual: {location.pathname}</p>;
}

/** Renderiza o shell real do cliente numa rota arbitrária. */
function renderClientLayout(initialEntry) {
    return render(
        <MemoryRouter
            initialEntries={[initialEntry]}
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            <Routes>
                <Route element={<ClientLayout />}>
                    <Route path="*" element={<LocationProbe />} />
                </Route>
            </Routes>
        </MemoryRouter>,
    );
}

describe("RoleNavigation", () => {
    beforeEach(() => {
        layoutMocks.getCurrentConsultationSession.mockReset().mockResolvedValue(null);
        layoutMocks.logout.mockReset().mockResolvedValue(undefined);
        layoutMocks.logoutAll.mockReset().mockResolvedValue(undefined);
        localStorage.clear();
    });

    it("abre a secção atual e permite operar um único accordion por teclado", async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter
                initialEntries={["/consulta/ativa"]}
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                <NavigationHarness />
            </MemoryRouter>,
        );

        const navigation = screen.getByRole("navigation", {
            name: "Navegação Área do cliente",
        });
        const consultationToggle = within(navigation).getByRole("button", {
            name: "Consulta",
        });
        const skinToggle = within(navigation).getByRole("button", {
            name: "Pele e rotina",
        });

        expect(consultationToggle).toHaveAttribute("aria-expanded", "true");
        expect(skinToggle).toHaveAttribute("aria-expanded", "false");
        expect(
            within(navigation).getByRole("link", { name: "Consulta atual" }),
        ).toHaveAttribute("aria-current", "page");
        expect(document.getElementById(consultationToggle.getAttribute("aria-controls")))
            .not.toHaveAttribute("hidden");

        skinToggle.focus();
        await user.keyboard("{Enter}");

        expect(skinToggle).toHaveFocus();
        expect(skinToggle).toHaveAttribute("aria-expanded", "true");
        expect(consultationToggle).toHaveAttribute("aria-expanded", "false");
        expect(
            within(navigation).queryByRole("link", { name: "Consulta atual" }),
        ).not.toBeInTheDocument();
        expect(
            within(navigation).getByRole("link", { name: "A minha pele" }),
        ).toBeVisible();

        await user.keyboard("{Enter}");
        expect(skinToggle).toHaveAttribute("aria-expanded", "false");
        expect(
            within(navigation).queryByRole("link", { name: "A minha pele" }),
        ).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Abrir rotina" }));
        await waitFor(() => {
            expect(skinToggle).toHaveAttribute("aria-expanded", "true");
        });
        expect(
            within(navigation).getByRole("link", { name: "Rotina" }),
        ).toHaveAttribute("aria-current", "page");
    });

    it("mantém administrador e consultor com grupos sempre visíveis", () => {
        const { rerender } = render(
            <MemoryRouter>
                <RoleNavigation
                    navigation={getRoleNavigation("administrador")}
                    pathname="/admin/produtos"
                />
            </MemoryRouter>,
        );

        let navigation = screen.getByRole("navigation", {
            name: "Navegação Administração",
        });
        expect(within(navigation).queryByRole("button")).not.toBeInTheDocument();
        expect(within(navigation).getByText("Definições")).toBeVisible();
        expect(within(navigation).getByRole("link", { name: "Produtos" }))
            .toHaveAttribute("aria-current", "page");

        rerender(
            <MemoryRouter>
                <RoleNavigation
                    navigation={getRoleNavigation("consultor")}
                    pathname="/consultoria/revisoes"
                />
            </MemoryRouter>,
        );

        navigation = screen.getByRole("navigation", {
            name: "Navegação Consultoria",
        });
        expect(within(navigation).queryByRole("button")).not.toBeInTheDocument();
        expect(within(navigation).getByRole("link", { name: "Fila de revisões" }))
            .toHaveAttribute("aria-current", "page");
    });

    it("move a conta e notificações para o avatar e conserva o carrinho na topbar", async () => {
        const user = userEvent.setup();
        renderClientLayout("/conta/perfil");

        const sidebar = screen.getByRole("navigation", {
            name: "Navegação Área do cliente",
        });
        expect(within(sidebar).getByRole("link", { name: "Início" }))
            .not.toHaveAttribute("aria-current");
        expect(
            screen.getByRole("button", { name: "Carrinho, 0 unidades" }),
        ).toBeVisible();
        expect(screen.queryByRole("link", { name: "Notificações" }))
            .not.toBeInTheDocument();

        const accountButton = screen.getByRole("button", {
            name: "Abrir menu da conta",
        });
        expect(accountButton).toHaveClass("role-account-button--active");
        await user.click(accountButton);

        const accountDialog = screen.getByRole("dialog", {
            name: "Conta e sessão",
        });
        const accountNavigation = within(accountDialog).getByRole("navigation", {
            name: "Navegação da conta",
        });
        expect(
            within(accountNavigation).getAllByRole("link").map((link) => link.textContent),
        ).toEqual(["Perfil", "Preferências", "Privacidade", "Notificações"]);
        expect(within(accountNavigation).getByRole("link", { name: "Perfil" }))
            .toHaveAttribute("aria-current", "page");

        await user.click(
            within(accountNavigation).getByRole("link", { name: "Notificações" }),
        );

        expect(await screen.findByText("Rota atual: /notificacoes")).toBeVisible();
        await waitFor(() => {
            expect(screen.queryByRole("dialog", { name: "Conta e sessão" }))
                .not.toBeInTheDocument();
        });
    });
});
