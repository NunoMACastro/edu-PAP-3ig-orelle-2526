/**
 * Modelo de preferencias de alertas de rotina da MF4.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const routineAlertPreferenceSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
        eveningTime: {
            type: String,
            default: "21:00",
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
        lastNotificationKey: {
            type: String,
            default: null,
        },
    },
    { timestamps: true },
);

export const RoutineAlertPreference = model(
    "RoutineAlertPreference",
    routineAlertPreferenceSchema,
);
