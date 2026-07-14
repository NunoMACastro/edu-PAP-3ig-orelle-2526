/**
 * Testes comportamentais dos consumidores dos hooks assíncronos partilhados.
 *
 * Cada página preserva o último resultado útil perante uma falha posterior e
 * cancela o pedido ativo quando deixa de estar montada.
 */
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SkinComparisonPage } from "../../src/pages/SkinComparisonPage.jsx";
import { SkinHistoryPage } from "../../src/pages/SkinHistoryPage.jsx";

const asyncMocks = vi.hoisted(() => ({
    apiRequest: vi.fn(),
}));

vi.mock("../../src/services/apiClient.js", () => ({
    apiRequest: asyncMocks.apiRequest,
}));

const COMPARISON_OPTIONS = Object.freeze([
    {
        selectionKey: "moment-one",
        date: "2026-01-01T10:00:00.000Z",
        skinType: "mista",
        imageUrl: null,
    },
    {
        selectionKey: "moment-two",
        date: "2026-02-01T10:00:00.000Z",
        skinType: "mista",
        imageUrl: null,
    },
]);

/** Renderiza uma página com Router e, opcionalmente, um parâmetro de rota. */
function renderPage(element, route = "/", routePath = "*") {
    return render(
        <MemoryRouter
            initialEntries={[route]}
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            <Routes>
                <Route path={routePath} element={element} />
            </Routes>
        </MemoryRouter>,
    );
}

describe("páginas assíncronas resilientes", () => {
    beforeEach(() => {
        asyncMocks.apiRequest.mockReset();
    });

    it("preserva a comparação de pele quando o retry falha", async () => {
        let comparisonCalls = 0;
        asyncMocks.apiRequest.mockImplementation(async (path, options = {}) => {
            expect(options.signal).toBeInstanceOf(AbortSignal);
            if (path === "/me/skin-analyses/comparison-options") {
                return { analyses: COMPARISON_OPTIONS };
            }
            if (path === "/me/skin-comparisons") {
                comparisonCalls += 1;
                if (comparisonCalls > 1) throw new Error("Comparação indisponível");
                return {
                    comparison: {
                        summary: "Comparação válida preservada.",
                        daysBetween: 31,
                        metricDeltas: [
                            {
                                metric: "Hidratação",
                                baselineValue: 40,
                                followUpValue: 55,
                                changeLabel: "Melhoria observada",
                            },
                        ],
                        limitations: ["Comparação apenas cosmética."],
                    },
                };
            }
            throw new Error(`Pedido inesperado: ${path}`);
        });

        const user = userEvent.setup();
        renderPage(<SkinComparisonPage />);
        const compare = await screen.findByRole("button", {
            name: "Comparar momentos",
        });
        await user.click(compare);
        expect(await screen.findByText("Comparação válida preservada.")).toBeVisible();

        await user.click(compare);
        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Comparação indisponível",
        );
        expect(screen.getByText("Comparação válida preservada.")).toBeVisible();
    });

    it("preserva o histórico da pele quando o refresh falha", async () => {
        asyncMocks.apiRequest
            .mockResolvedValueOnce({
                history: [
                    {
                        type: "analysis",
                        id: "analysis-one",
                        createdAt: "2026-02-01T10:00:00.000Z",
                        providerVersion: "gpt-5.4-mini",
                        providerName: "OpenAI",
                    },
                ],
            })
            .mockRejectedValueOnce(new Error("Histórico da pele indisponível"));

        const user = userEvent.setup();
        renderPage(<SkinHistoryPage />);
        expect(
            await screen.findByText("Análise cosmética registada."),
        ).toBeVisible();
        const refresh = screen.getByRole("button", { name: "Atualizar histórico" });
        expect(asyncMocks.apiRequest.mock.calls[0][1].signal).toBeInstanceOf(
            AbortSignal,
        );

        await user.click(refresh);
        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Histórico da pele indisponível",
        );
        expect(
            screen.getByText("Análise cosmética registada."),
        ).toBeVisible();
    });

    const abortCases = [
        {
            name: "comparação de pele",
            renderConsumer: () => renderPage(<SkinComparisonPage />),
            trigger: null,
        },
        {
            name: "histórico da pele",
            renderConsumer: () => renderPage(<SkinHistoryPage />),
            trigger: null,
        },
    ];

    it.each(abortCases)(
        "aborta o pedido ativo de $name ao desmontar",
        async ({ renderConsumer, trigger }) => {
            let observedSignal;
            const pendingRequest = ({ signal }) => {
                observedSignal = signal;
                return new Promise(() => {});
            };

            asyncMocks.apiRequest.mockImplementation((path, options = {}) =>
                pendingRequest(options),
            );

            const view = renderConsumer();
            if (trigger) {
                fireEvent.click(screen.getByRole("button", { name: trigger }));
            }
            await waitFor(() => expect(observedSignal).toBeInstanceOf(AbortSignal));

            view.unmount();
            expect(observedSignal.aborted).toBe(true);
        },
    );
});
