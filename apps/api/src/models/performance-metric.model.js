/**
 * Modelo de metricas de performance minimizadas para operacoes RNF da MF6.
 *
 * Guarda apenas tempos e estado operacional. Nao inclui userId, caminhos de
 * ficheiros, fotografias, relatorios, tokens ou outros dados pessoais.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

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

/**
 * Modelo Mongoose de metricas de performance minimizadas.
 *
 * @type {import("mongoose").Model}
 */
export const PerformanceMetric = model(
    "PerformanceMetric",
    performanceMetricSchema,
);
