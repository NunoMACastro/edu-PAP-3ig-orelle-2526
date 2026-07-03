/**
 * Modelo de notificacoes internas da MF4.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const NOTIFICATION_TYPES = Object.freeze({
    PROMOTION: "promotion",
    NEW_PRODUCT: "new_product",
    ORDER_STATUS: "order_status",
    ROUTINE_ALERT: "routine_alert",
});

export const NOTIFICATION_TYPE_VALUES = Object.freeze(
    Object.values(NOTIFICATION_TYPES),
);

const notificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: NOTIFICATION_TYPE_VALUES,
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
        metadata: {
            type: Map,
            of: String,
            default: {},
        },
    },
    { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = model("Notification", notificationSchema);
