/**
 * Service de relatorio facial personalizado.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";
import { generateRecommendationsForUser } from "./recommendation.service.js";
import {
    ensureReportUnlockForRecommendations,
    toReportAccessDto,
    unlockReportWithSimulatedPayment,
} from "./report-unlock.service.js";
import { createVoucherForReportUnlock } from "./voucher.service.js";
import { assertAbortSignalActive } from "../utils/abort-signal.util.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
    AI_CONSULTATION_STATUS,
} from "../models/ai-consultation-session.model.js";
import { FACE_REPORT_LIFECYCLE } from "../models/face-report.model.js";
import { getFaceReportV2ForUser } from "./report-access.service.js";

const TRANSACTION_OPTIONS = Object.freeze({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary",
    maxCommitTimeMS: 10_000,
});

/**
 * Constroi resumo cosmetico limitado a partir da analise.
 *
 * @function buildCosmeticSummary
 * @param {object} analysis - Analise concluida.
 * @returns {string} Resumo textual.
 */
function buildCosmeticSummary(analysis) {
    const { skinType, acne, manchas, rugas, oleosidade } = analysis.findings;

    return [
        analysis.isDemo
            ? "Demonstração académica: os valores seguintes são simulados."
            : "Avaliação cosmética assistida pelo provider configurado.",
        `Tipo de pele estimado: ${skinType.label}.`,
        `Acne: ${acne.label}.`,
        `Manchas: ${manchas.label}.`,
        `Rugas: ${rugas.label}.`,
        `Oleosidade: ${oleosidade.label}.`,
        "Esta leitura é cosmética e deve ser interpretada com as limitações indicadas.",
    ].join(" ");
}

/**
 * Gera rotina geral sem recomendacao comercial personalizada.
 *
 * @function buildRoutineSuggestions
 * @param {object} analysis - Analise concluida.
 * @returns {{period: "manha"|"noite", title: string, reason: string}[]} Sugestoes de rotina.
 */
function buildRoutineSuggestions(analysis) {
    const oleosidade = analysis.findings.oleosidade.label;

    return [
        {
            period: "manha",
            title: "Limpeza suave",
            reason: `Ajuda a preparar a pele sem assumir tratamento médico. Resultado de oleosidade: ${oleosidade}.`,
        },
        {
            period: "manha",
            title: "Cuidado emoliente leve",
            reason: "O cuidado emoliente apoia conforto da pele e não substitui avaliação profissional.",
        },
        {
            period: "noite",
            title: "Remover impurezas",
            reason: "A rotina noturna reduz acumulação de resíduos do dia.",
        },
        {
            period: "noite",
            title: "Reforçar cuidado noturno",
            reason: "Apoia consistência da rotina sem prometer resultado clínico.",
        },
    ];
}

/**
 * Converte relatorio para resposta segura.
 *
 * @function toFaceReportResponse
 * @param {object} report - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, analysisId: string, analysisMode: string, analysisIsDemo: boolean, analysisProviderVersion: string, cosmeticSummary: string, routineSuggestions: object[], sources: string[], limitations: string[], createdAt: Date|undefined}} Relatorio publico.
 */
function toFaceReportResponse(report, access = undefined) {
    return {
        id: report._id.toString(),
        analysisId: report.analysisId.toString(),
        analysisMode: report.analysisMode,
        analysisIsDemo: report.analysisIsDemo,
        analysisProviderVersion: report.analysisProviderVersion,
        cosmeticSummary: report.cosmeticSummary,
        routineSuggestions: report.routineSuggestions,
        sources: report.sources,
        limitations: report.limitations,
        createdAt: report.createdAt,
        access,
    };
}

/**
 * Converte gate bloqueado para resposta segura sem dados comerciais completos.
 *
 * @function toLockedFaceReportResponse
 * @param {object} report - Relatorio persistido.
 * @param {object} unlock - Gate academico associado.
 * @returns {object} Metadata segura da paywall.
 */
function toLockedFaceReportResponse(report, unlock) {
    const access = toReportAccessDto(unlock);

    return {
        reportId: report._id.toString(),
        id: report._id.toString(),
        status: access.status,
        recommendedTotalCents: access.recommendedTotalCents,
        depositCents: access.depositCents,
        recommendationCount: access.recommendationCount,
        analysisMode: report.analysisMode,
        analysisIsDemo: report.analysisIsDemo,
        analysisProviderVersion: report.analysisProviderVersion,
        access,
        message:
            "Demonstração académica — usa Pagamento simulado para desbloquear; não será efetuada qualquer cobrança.",
    };
}

/**
 * Procura relatorio existente da analise ou cria um novo.
 *
 * @async
 * @function findOrCreateReportForAnalysis
 * @param {string} userId - Utilizador autenticado.
 * @param {object} analysis - Analise concluida.
 * @returns {Promise<object>} Relatorio persistido.
 */
export async function findOrCreateReportForAnalysis(
    userId,
    analysis,
    { session, signal } = {},
) {
    assertAbortSignalActive(signal, "Geração do relatório cancelada.");
    const report = await FaceReport.findOneAndUpdate(
        { userId, analysisId: analysis._id },
        {
            $setOnInsert: {
                userId,
                analysisId: analysis._id,
                schemaVersion: 1,
                analysisMode: analysis.mode,
                analysisIsDemo: analysis.isDemo,
                analysisProviderVersion: analysis.providerVersion,
                cosmeticSummary: buildCosmeticSummary(analysis),
                routineSuggestions: buildRoutineSuggestions(analysis),
                sources: analysis.sources,
                limitations: analysis.limitations,
                privacyStatus: "active",
            },
        },
        {
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
            upsert: true,
            ...(session ? { session } : {}),
        },
    );

    assertAbortSignalActive(signal, "Geração do relatório cancelada.");
    return report;
}

/**
 * Gera relatorio da ultima analise concluida do utilizador.
 *
 * @async
 * @function generateReportFromLatestAnalysis
 * @param {string} userId - Utilizador autenticado.
 * @param {{signal?: AbortSignal, failureInjector?: Function}} [options] - Cancelamento e hook interno de rollback.
 * @returns {Promise<object>} Relatorio criado.
 * @throws {AppError} Quando o utilizador ainda nao tem analise facial concluida.
 */
export async function generateReportFromLatestAnalysis(
    userId,
    {
        signal,
        failureInjector = async () => undefined,
    } = {},
) {
    assertAbortSignalActive(signal, "Geração do relatório cancelada.");
    const session =
        mongoose.connection.readyState === 1 ? await mongoose.startSession() : null;
    let result;

    const generateAtomically = async () => {
        assertAbortSignalActive(signal, "Geração do relatório cancelada.");
        let analysisQuery = FaceAnalysis.findOne({
            userId,
            status: "completed",
        }).sort({ createdAt: -1 });
        if (session) analysisQuery = analysisQuery.session(session);
        const analysis = await analysisQuery;
        assertAbortSignalActive(signal, "Geração do relatório cancelada.");

        if (!analysis) {
            throw new AppError(400, "Análise facial concluída obrigatória");
        }

        const report = await findOrCreateReportForAnalysis(userId, analysis, {
            session,
            signal,
        });
        await failureInjector("after_report");
        assertAbortSignalActive(signal, "Geração do relatório cancelada.");

        const recommendations = await generateRecommendationsForUser(userId, {
            allowLockedReport: true,
            session,
            signal,
        });
        await failureInjector("after_recommendations");
        assertAbortSignalActive(signal, "Geração do relatório cancelada.");

        const unlock = await ensureReportUnlockForRecommendations(
            {
                userId,
                analysisId: analysis._id,
                reportId: report._id,
                recommendations,
            },
            { session, signal },
        );
        await failureInjector("after_unlock");
        // Última barreira cooperativa antes de o callback transacional devolver
        // controlo ao driver para commit.
        assertAbortSignalActive(signal, "Geração do relatório cancelada.");

        result =
            unlock.status === "unlocked"
                ? toFaceReportResponse(report, toReportAccessDto(unlock))
                : toLockedFaceReportResponse(report, unlock);
    };

    try {
        if (session) {
            await session.withTransaction(generateAtomically, TRANSACTION_OPTIONS);
        } else {
            // Compatibilidade com testes unitários isolados sem MongoDB. O
            // runtime pronto exige replica set e percorre sempre a via atómica.
            await generateAtomically();
        }

        return result;
    } finally {
        await session?.endSession();
    }
}

/**
 * Confirma pagamento academico simulado e devolve relatorio completo.
 *
 * @async
 * @function unlockReportWithAcademicPayment
 * @param {string} userId - Utilizador autenticado.
 * @param {string} reportId - Relatorio a desbloquear.
 * @param {string} idempotencyKey - Chave HTTP validada.
 * @param {{failureInjector?: Function, signal?: AbortSignal}} [options] - Cancelamento e injeção apenas para testes de rollback.
 * @returns {Promise<{report: object, voucher: object}>} Relatorio completo e voucher.
 */
export async function unlockReportWithAcademicPayment(
    userId,
    reportId,
    idempotencyKey,
    { failureInjector = async () => undefined, signal } = {},
) {
    assertAbortSignalActive(signal, "Pagamento simulado do relatório cancelado.");
    const session = await mongoose.startSession();
    let result;

    try {
        await session.withTransaction(async () => {
            assertAbortSignalActive(
                signal,
                "Pagamento simulado do relatório cancelado.",
            );
            const report = await FaceReport.findOne({
                _id: reportId,
                userId,
                privacyStatus: { $nin: ["deleted", "anonymized"] },
            }).session(session);
            assertAbortSignalActive(
                signal,
                "Pagamento simulado do relatório cancelado.",
            );

            if (!report) {
                throw new AppError(404, "Relatório não encontrado");
            }

            const unlock = await unlockReportWithSimulatedPayment(
                userId,
                reportId,
                idempotencyKey,
                { session, signal },
            );
            await failureInjector("after_unlock");
            assertAbortSignalActive(
                signal,
                "Pagamento simulado do relatório cancelado.",
            );
            const voucher = await createVoucherForReportUnlock(userId, unlock, {
                session,
            });
            await failureInjector("after_voucher");
            // Impede que unlock/voucher confirmem depois de o timeout HTTP já
            // ter devolvido uma resposta controlada ao cliente.
            assertAbortSignalActive(
                signal,
                "Pagamento simulado do relatório cancelado.",
            );

            if (report.schemaVersion >= 2) {
                report.lifecycleStatus = FACE_REPORT_LIFECYCLE.UNLOCKED;
                await report.save({ session });
                const consultationUpdate = await AiConsultationSession.updateOne(
                    { _id: report.consultationSessionId, userId },
                    {
                        $set: {
                            flowState: AI_CONSULTATION_FLOW_STATES.UNLOCKED,
                            status: AI_CONSULTATION_STATUS.COMPLETED,
                            isOpen: false,
                            completedAt: unlock.unlockedAt ?? new Date(),
                        },
                    },
                    { session },
                );
                if (consultationUpdate.matchedCount !== 1) {
                    throw new AppError(409, "Sessão da consulta indisponível");
                }
            }

            result = {
                report: toFaceReportResponse(report, toReportAccessDto(unlock)),
                voucher,
                isV2: report.schemaVersion >= 2,
            };
        }, TRANSACTION_OPTIONS);

        if (result.isV2) {
            result.report = await getFaceReportV2ForUser(userId, reportId);
        }
        delete result.isV2;
        return result;
    } finally {
        await session.endSession();
    }
}
