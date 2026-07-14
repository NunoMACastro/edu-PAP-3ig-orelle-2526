/** Barreiras partilhadas para derivados de análises protegidas pelo report. */
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../models/report-unlock.model.js";

/**
 * Devolve apenas IDs de análises cujo relatório do titular já foi
 * desbloqueado. O Set evita que evolução/comparação implementem gates
 * divergentes ou façam inferências a partir de reports fechados.
 *
 * @param {string} userId - Titular autenticado.
 * @param {{analysisIds?: Array<string|object>}} [options] - Âmbito opcional.
 * @returns {Promise<Set<string>>} IDs autorizados em formato string.
 */
export async function listUnlockedAnalysisIds(
    userId,
    { analysisIds = null } = {},
) {
    const normalizedIds = Array.isArray(analysisIds)
        ? analysisIds.filter(Boolean)
        : null;
    const unlocks = await ReportUnlock.find({
        userId,
        status: REPORT_UNLOCK_STATUS.UNLOCKED,
        ...(normalizedIds ? { analysisId: { $in: normalizedIds } } : {}),
    })
        .select("analysisId")
        .lean();
    return new Set(unlocks.map(({ analysisId }) => analysisId.toString()));
}
