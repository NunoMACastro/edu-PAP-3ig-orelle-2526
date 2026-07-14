/**
 * Modelo de metricas de performance minimizadas para RNFs da Orelle.
 *
 * A MF6 criou metricas para analise facial. A MF8 reutiliza o mesmo modelo
 * para pedidos HTTP, mantendo fora da base de dados userId, headers, cookies,
 * payloads completos, paths internos, fotografias, relatorios e tokens.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const PERFORMANCE_OPERATIONS = Object.freeze({
    FACE_ANALYSIS: "face_analysis",
    HTTP_REQUEST: "http_request",
});

export const PERFORMANCE_STATUSES = Object.freeze({
    SUCCESS: "success",
    CLIENT_ERROR: "client_error",
    ERROR: "error",
    TIMEOUT: "timeout",
});

const performanceMetricSchema = new Schema(
    {
        operation: {
            type: String,
            enum: Object.values(PERFORMANCE_OPERATIONS),
            required: true,
            index: true,
        },
        route: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "system",
        },
        method: {
            type: String,
            enum: [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "HEAD",
                "OPTIONS",
                "SYSTEM",
            ],
            default: "SYSTEM",
        },
        statusCode: {
            type: Number,
            min: 100,
            max: 599,
            default: 200,
        },
        durationMs: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(PERFORMANCE_STATUSES),
            required: true,
            index: true,
        },
        budgetMs: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de metricas de performance minimizadas.
 *
 * @type {import("mongoose").Model}
 */
export const PerformanceMetric = model(
    "PerformanceMetric",
    performanceMetricSchema,
);
