/** Testes comportamentais do master-detail acessível da área do consultor. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { ConsultationReviewsPage } from "../../src/features/consultation/ConsultationReviewsPage.jsx";

const consultationMocks = vi.hoisted(() => ({
    decideConsultationReview: vi.fn(),
    downloadConsultationReviewPhoto: vi.fn(),
    getConsultationReview: vi.fn(),
    listConsultationReviews: vi.fn(),
}));

vi.mock("../../src/features/consultation/consultationApi.js", () =>
    consultationMocks,
);

const REVIEW_ITEM = Object.freeze({
    id: "review-one",
    summary: "Consulta de hidratação",
    status: "pending",
});

beforeEach(() => {
    consultationMocks.listConsultationReviews.mockReset().mockResolvedValue([
        REVIEW_ITEM,
    ]);
    consultationMocks.getConsultationReview.mockReset().mockResolvedValue({
        ...REVIEW_ITEM,
        sourceLabels: [],
        recommendations: [],
        photoAccess: { granted: false },
    });
    consultationMocks.decideConsultationReview.mockReset();
    consultationMocks.downloadConsultationReviewPhoto.mockReset();
});

it("abre o detalhe, transfere o foco e regressa à fila", async () => {
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <ConsultationReviewsPage />
        </MemoryRouter>,
    );

    const queueItem = await screen.findByRole("button", {
        name: "Consulta de hidratação: Pendente",
    });
    await user.click(queueItem);

    const detailHeading = screen.getByRole("heading", {
        name: "Detalhe da revisão",
    });
    await waitFor(() => expect(detailHeading).toHaveFocus());
    expect(queueItem).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("Pendente").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Voltar à fila" }));
    const queueHeading = screen.getByRole("heading", { name: "Fila" });
    await waitFor(() => expect(queueHeading).toHaveFocus());
    expect(queueItem).toHaveAttribute("aria-pressed", "false");
});

it("renderiza o relatório v6, envia orientação ajustada e limpa o detalhe final", async () => {
    consultationMocks.listConsultationReviews
        .mockResolvedValueOnce([REVIEW_ITEM])
        .mockResolvedValueOnce([]);
    consultationMocks.getConsultationReview.mockResolvedValue({
        ...REVIEW_ITEM,
        reportVersion: 6,
        requestedAt: "2026-07-14T11:00:00.000Z",
        sourceLabels: ["Catálogo validado"],
        recommendations: [
            {
                id: "recommendation-one",
                score: 0.91,
                product: {
                    name: "Primer suave",
                    brandName: "Orélle",
                    priceCents: 2100,
                    stock: 6,
                    variant: { label: "Neutral" },
                },
                explanation: "Adequado ao objetivo cosmético escolhido.",
                usage: "Aplicar antes da maquilhagem.",
                cautions: ["Evitar o contacto com os olhos."],
                sourceLabels: ["objetivo da consulta: maquilhagem"],
                limitations: ["O resultado real pode variar."],
                routineSlotCodes: ["prime"],
                currentAvailability: {
                    available: true,
                    priceCents: 2100,
                    stock: 6,
                },
            },
        ],
        report: {
            schemaVersion: 2,
            version: 6,
            generatedAt: "2026-07-14T10:00:00.000Z",
            objectives: [{ code: "makeup", priority: "primary" }],
            content: {
                assessment:
                    "Avaliação cosmética original suficientemente detalhada.",
                answerSummary: "Resumo seguro da consulta.",
                observations: ["Observação cosmética controlada."],
                safetyFlags: ["Evitar a zona ocular sensibilizada."],
                photoQuality: { status: "pass", warnings: [] },
                routine: [
                    {
                        routineSlotCode: "prime",
                        period: "manha",
                        priority: "essential",
                        title: "Preparação",
                        reason: "Preparar a pele antes da maquilhagem.",
                        instructions: "Aplicar uma camada fina.",
                        cautions: [],
                        recommendationIds: ["recommendation-one"],
                    },
                ],
            },
            limitations: ["O resultado real pode variar."],
            sourceLabels: ["Fotografia frontal autorizada"],
            provenance: { provider: "openai" },
        },
        photoAccess: { granted: false },
    });
    consultationMocks.decideConsultationReview.mockResolvedValue({
        id: REVIEW_ITEM.id,
        status: "adjusted",
    });
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <ConsultationReviewsPage />
        </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: /Consulta de hidratação/ }));
    expect(await screen.findByText("Resumo seguro da consulta.")).toBeVisible();
    expect(screen.getByText(/Produtos associados: Primer suave/)).toBeVisible();
    expect(screen.getByText("Preço histórico")).toBeVisible();
    expect(screen.getByText("Preço atual")).toBeVisible();
    expect(screen.getByText("Fotografia frontal autorizada")).toBeVisible();

    await user.selectOptions(screen.getByLabelText("Decisão"), "adjusted");
    const explanation = screen.getByLabelText(
        "Explicação ajustada — Primer suave",
    );
    await user.clear(explanation);
    await user.type(
        explanation,
        "Motivo cosmético revisto pelo consultor humano.",
    );
    await user.type(
        screen.getByLabelText("Nota para o cliente"),
        "Orientação revista pelo consultor humano.",
    );
    await user.click(screen.getByRole("button", { name: "Guardar decisão" }));

    await waitFor(() =>
        expect(consultationMocks.decideConsultationReview).toHaveBeenCalledWith(
            REVIEW_ITEM.id,
            expect.objectContaining({
                decision: "adjusted",
                adjustedContent: expect.objectContaining({
                    recommendations: [
                        expect.objectContaining({
                            recommendationId: "recommendation-one",
                            explanation:
                                "Motivo cosmético revisto pelo consultor humano.",
                        }),
                    ],
                }),
            }),
            { signal: expect.any(AbortSignal) },
        ),
    );
    expect(
        await screen.findByText("Revisão ajustada e retirada da fila."),
    ).toBeVisible();
    expect(screen.getByText("Seleciona uma revisão")).toBeVisible();
});

it("preserva o formulário e orienta o consultor perante REVIEW_STALE", async () => {
    consultationMocks.getConsultationReview.mockResolvedValue({
        ...REVIEW_ITEM,
        recommendations: [],
        report: {
            schemaVersion: 2,
            content: {
                assessment: "Avaliação cosmética em revisão.",
                routine: [],
            },
        },
        photoAccess: { granted: false },
    });
    const staleError = Object.assign(
        new Error("Preço ou stock mudou; atualiza a revisão antes de decidir"),
        { details: { code: "REVIEW_STALE" } },
    );
    consultationMocks.decideConsultationReview.mockRejectedValue(staleError);
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <ConsultationReviewsPage />
        </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: /Consulta de hidratação/ }));
    fireEvent.change(screen.getByLabelText("Nota para o cliente"), {
        target: { value: "Relatório revisto pelo consultor humano." },
    });
    await user.click(screen.getByRole("button", { name: "Guardar decisão" }));

    expect(
        await screen.findByText(/O catálogo ou o perfil mudou/),
    ).toBeVisible();
    expect(screen.getAllByText("Consulta de hidratação").length).toBeGreaterThan(
        0,
    );
    expect(screen.getByLabelText("Nota para o cliente")).toHaveValue(
        "Relatório revisto pelo consultor humano.",
    );
});

it("mantém os editores v6 indisponíveis numa revisão legacy", async () => {
    consultationMocks.getConsultationReview.mockResolvedValue({
        ...REVIEW_ITEM,
        recommendations: [],
        report: null,
        photoAccess: { granted: false },
    });
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <ConsultationReviewsPage />
        </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: /Consulta de hidratação/ }));
    expect(screen.getByRole("option", { name: "Ajustar" })).toBeDisabled();
    expect(screen.getByText(/editores v6 não estão disponíveis/)).toBeVisible();
});
