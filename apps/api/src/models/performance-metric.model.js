import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Schema de métricas técnicas minimizadas.
 *
 * Guarda apenas o necessário para provar desempenho e investigar falhas sem
 * copiar fotografias, relatórios ou identificadores sensíveis para logs.
 */
const performanceMetricSchema = new Schema(
    {
        operation: {
            type: String,
            enum: ["face_analysis"],
            required: true,
            index: true,
        },
        durationMs: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["success", "timeout", "error"],
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

performanceMetricSchema.index({ operation: 1, createdAt: -1 });

/**
 * Modelo Mongoose de métricas de performance.
 *
 * @type {import("mongoose").Model}
 */
export const PerformanceMetric = model(
    "PerformanceMetric",
    performanceMetricSchema,
);