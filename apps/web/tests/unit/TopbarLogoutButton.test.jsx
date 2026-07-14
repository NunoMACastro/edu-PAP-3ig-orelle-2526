/** Testes comportamentais do logout direto nas topbars autenticadas. */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopbarLogoutButton } from "../../src/components/TopbarLogoutButton.jsx";

const authMock = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock("../../src/context/AuthContext.jsx", () => ({
    useAuth: () => ({ logout: authMock.logout }),
}));

describe("TopbarLogoutButton", () => {
    beforeEach(() => {
        authMock.logout.mockReset();
    });

    it("termina a sessão atual através da ação sempre visível", async () => {
        authMock.logout.mockResolvedValue(undefined);
        const user = userEvent.setup();
        render(<TopbarLogoutButton />);

        await user.click(
            screen.getByRole("button", { name: "Terminar sessão" }),
        );

        expect(authMock.logout).toHaveBeenCalledOnce();
    });

    it("apresenta uma falha sem esconder o botão", async () => {
        authMock.logout.mockRejectedValue(
            new Error("Não foi possível terminar a sessão."),
        );
        const user = userEvent.setup();
        render(<TopbarLogoutButton />);

        await user.click(
            screen.getByRole("button", { name: "Terminar sessão" }),
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Não foi possível terminar a sessão.",
        );
        expect(
            screen.getByRole("button", { name: "Terminar sessão" }),
        ).toBeEnabled();
    });
});
