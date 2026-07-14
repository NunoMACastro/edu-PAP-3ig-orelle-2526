/** Testes do fluxo reversível de desativação administrativa de contas. */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUsersPage } from "../../src/pages/AdminUsersPage.jsx";

const apiMock = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("../../src/services/apiClient.js", () => ({
    apiRequest: apiMock.apiRequest,
}));

const ACTIVE_USER = Object.freeze({
    id: "user-one",
    email: "cliente@example.test",
    role: "cliente",
    isActive: true,
    accountStatus: "active",
});

describe("AdminUsersPage", () => {
    beforeEach(() => {
        apiMock.apiRequest.mockReset();
    });

    it("confirma DESATIVAR, desativa e permite reativar sem eliminar dados", async () => {
        apiMock.apiRequest.mockImplementation(async (path, options = {}) => {
            if (path === "/admin/users" && !options.method) {
                return { users: [ACTIVE_USER] };
            }
            if (path === "/admin/users/user-one" && options.method === "DELETE") {
                return {
                    user: {
                        ...ACTIVE_USER,
                        isActive: false,
                        accountStatus: "suspended",
                    },
                };
            }
            if (
                path === "/admin/users/user-one/status" &&
                options.method === "PATCH"
            ) {
                expect(JSON.parse(options.body)).toEqual({ status: "active" });
                return { user: ACTIVE_USER };
            }
            throw new Error(`Pedido inesperado: ${path}`);
        });

        const user = userEvent.setup();
        render(<AdminUsersPage />);
        await screen.findByRole("heading", { name: ACTIVE_USER.email });

        await user.click(screen.getByRole("button", { name: "Desativar conta" }));
        const dialog = screen.getByRole("dialog", { name: "Desativar conta" });
        const confirm = within(dialog).getByRole("button", {
            name: "Desativar conta",
        });
        expect(confirm).toBeDisabled();
        await user.type(
            within(dialog).getByRole("textbox", {
                name: /Escreve DESATIVAR para confirmar/,
            }),
            "DESATIVAR",
        );
        await user.click(confirm);

        await waitFor(() => expect(dialog).not.toBeInTheDocument());
        expect(screen.getByText(/Desativada administrativamente/)).toBeVisible();
        expect(
            screen.queryByRole("button", { name: "Eliminar conta" }),
        ).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Reativar conta" }));
        await waitFor(() => {
            const row = screen.getByRole("heading", { name: ACTIVE_USER.email }).closest("article");
            expect(within(row).getByText("Ativa")).toBeVisible();
        });
        expect(apiMock.apiRequest).toHaveBeenCalledWith(
            "/admin/users/user-one",
            { method: "DELETE" },
        );
        expect(apiMock.apiRequest).toHaveBeenCalledWith(
            "/admin/users/user-one/status",
            expect.objectContaining({ method: "PATCH" }),
        );
    });

    it("mantém linha, estado e modal quando a desativação falha", async () => {
        apiMock.apiRequest.mockImplementation(async (path, options = {}) => {
            if (path === "/admin/users" && !options.method) {
                return { users: [ACTIVE_USER] };
            }
            if (path === "/admin/users/user-one" && options.method === "DELETE") {
                throw new Error("Desativação temporariamente indisponível");
            }
            throw new Error(`Pedido inesperado: ${path}`);
        });

        const user = userEvent.setup();
        render(<AdminUsersPage />);
        await screen.findByRole("heading", { name: ACTIVE_USER.email });
        await user.click(screen.getByRole("button", { name: "Desativar conta" }));
        const dialog = screen.getByRole("dialog", { name: "Desativar conta" });
        await user.type(
            within(dialog).getByRole("textbox", {
                name: /Escreve DESATIVAR para confirmar/,
            }),
            "DESATIVAR",
        );
        await user.click(
            within(dialog).getByRole("button", { name: "Desativar conta" }),
        );

        expect(await within(dialog).findByRole("alert")).toHaveTextContent(
            "Desativação temporariamente indisponível",
        );
        expect(dialog).toBeVisible();
        const row = screen.getByRole("heading", { name: ACTIVE_USER.email }).closest("article");
        expect(within(row).getByText("Ativa")).toBeVisible();
        expect(
            screen.queryByRole("button", { name: "Reativar conta" }),
        ).not.toBeInTheDocument();
    });
});
