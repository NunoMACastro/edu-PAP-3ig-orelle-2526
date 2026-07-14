/** Teste comportamental do bootstrap de sessão quando a API está offline. */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequireRole } from "../../src/components/AppLayouts.jsx";
import { AuthProvider } from "../../src/context/AuthContext.jsx";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("AuthProvider bootstrap", () => {
    it("apresenta retry e não transforma falha de rede em logout", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

        render(
            <MemoryRouter
                initialEntries={["/conta"]}
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                <AuthProvider>
                    <RequireRole allowedRoles={["cliente"]}>
                        <p>Conteúdo privado</p>
                    </RequireRole>
                </AuthProvider>
            </MemoryRouter>,
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Não foi possível confirmar a sessão",
        );
        expect(
            screen.getByRole("button", {
                name: "Tentar confirmar sessão novamente",
            }),
        ).toBeInTheDocument();
        expect(screen.queryByText("Conteúdo privado")).not.toBeInTheDocument();
    });
});
