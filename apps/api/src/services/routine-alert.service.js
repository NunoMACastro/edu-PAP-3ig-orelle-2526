/**
 * Service de alertas personalizados de rotina.
 */
import { DailyRoutine } from "../models/daily-routine.model.js";
import {
    Notification,
    NOTIFICATION_TYPES,
} from "../models/notification.model.js";
import { RoutineAlertPreference } from "../models/routine-alert-preference.model.js";

/**
 * Converte preferencia para DTO.
 *
 * @function toRoutineAlertPreferenceDto
 * @param {object} preference - Documento Mongoose.
 * @returns {object} Preferencia segura.
 */
function toRoutineAlertPreferenceDto(preference) {
    return {
        id: preference._id.toString(),
        enabled: preference.enabled,
        eveningTime: preference.eveningTime,
        lastNotificationKey: preference.lastNotificationKey ?? null,
        updatedAt: preference.updatedAt,
    };
}

/**
 * Consulta ou cria preferencia default do utilizador.
 *
 * @async
 * @function getMyRoutineAlertPreference
 * @param {string} userId - ID autenticado.
 * @returns {Promise<object>} Preferencia.
 */
export async function getMyRoutineAlertPreference(userId) {
    const preference = await RoutineAlertPreference.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId, enabled: true, eveningTime: "21:00" } },
        { upsert: true, new: true, runValidators: true },
    );

    return toRoutineAlertPreferenceDto(preference);
}

/**
 * Atualiza preferencia de alerta do proprio utilizador.
 *
 * @async
 * @function updateMyRoutineAlertPreference
 * @param {string} userId - ID autenticado.
 * @param {{enabled: boolean, eveningTime: string}} input - Preferencia validada.
 * @returns {Promise<object>} Preferencia atualizada.
 */
export async function updateMyRoutineAlertPreference(userId, input) {
    const preference = await RoutineAlertPreference.findOneAndUpdate(
        { userId },
        { $set: input, $setOnInsert: { userId } },
        { upsert: true, new: true, runValidators: true },
    );

    return toRoutineAlertPreferenceDto(preference);
}

/**
 * Cria alertas de rotina devidos de forma idempotente.
 *
 * @async
 * @function createDueRoutineAlerts
 * @param {Date} [now=new Date()] - Momento de execucao controlavel em testes.
 * @returns {Promise<{createdCount: number}>} Numero de alertas criados.
 */
export async function createDueRoutineAlerts(now = new Date()) {
    const currentTime = now.toISOString().slice(11, 16);
    const dayKey = now.toISOString().slice(0, 10);
    const preferences = await RoutineAlertPreference.find({
        enabled: true,
        eveningTime: { $lte: currentTime },
        lastNotificationKey: { $ne: dayKey },
    }).limit(500);
    let createdCount = 0;

    for (const preference of preferences) {
        const routine = await DailyRoutine.findOne({ userId: preference.userId });
        if (!routine) continue;

        await Notification.create({
            userId: preference.userId,
            type: NOTIFICATION_TYPES.ROUTINE_ALERT,
            title: "Rotina noturna",
            message: "Está na hora da tua rotina cosmética noturna.",
            metadata: { source: "routine_alert", dayKey },
        });
        preference.lastNotificationKey = dayKey;
        await preference.save();
        createdCount += 1;
    }

    return { createdCount };
}
