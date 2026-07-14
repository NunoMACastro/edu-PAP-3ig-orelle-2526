/**
 * Service de alertas personalizados de rotina.
 */
import { NOTIFICATION_TYPES } from "../constants/domain.constants.js";
import mongoose from "mongoose";
import { DailyRoutine } from "../models/daily-routine.model.js";
import { Notification } from "../models/notification.model.js";
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
        const executeClaim = async (session = null) => {
            let routineQuery = DailyRoutine.findOne({ userId: preference.userId });
            if (session) routineQuery = routineQuery.session(session);
            const routine = await routineQuery;
            if (!routine) return false;

            const claimed = await RoutineAlertPreference.findOneAndUpdate(
                {
                    _id: preference._id,
                    enabled: true,
                    eveningTime: { $lte: currentTime },
                    lastNotificationKey: { $ne: dayKey },
                },
                { $set: { lastNotificationKey: dayKey } },
                { new: true, ...(session ? { session } : {}) },
            );
            if (!claimed) return false;

            const notification = {
                userId: preference.userId,
                type: NOTIFICATION_TYPES.ROUTINE_ALERT,
                title: "Rotina noturna",
                message: "Está na hora da tua rotina cosmética noturna.",
                metadata: { source: "routine_alert", dayKey },
            };
            if (session) {
                await Notification.create([notification], { session });
            } else {
                await Notification.create(notification);
            }
            return true;
        };

        if (mongoose.connection.readyState !== 1) {
            if (await executeClaim()) createdCount += 1;
            continue;
        }

        const session = await mongoose.startSession();
        let created = false;
        try {
            await session.withTransaction(async () => {
                // `withTransaction` pode repetir o callback após conflito; o
                // resultado tem de refletir apenas a tentativa confirmada.
                created = await executeClaim(session);
            });
            if (created) createdCount += 1;
        } finally {
            await session.endSession();
        }
    }

    return { createdCount };
}
