/**
 * Ledger privado da quota móvel de pré-visualizações de maquilhagem.
 *
 * Existe um único documento por titular. Cada reserva identifica a simulação
 * lógica que consumiu quota, permitindo que replays e retries internos não
 * sejam contabilizados novamente. As reservas antigas são podadas
 * atomicamente quando uma nova operação tenta reservar capacidade.
 */
import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const makeupSimulationQuotaReservationSchema = new Schema(
    {
        simulationId: {
            type: Schema.Types.ObjectId,
            ref: "MakeupSimulation",
            required: true,
        },
        createdAt: { type: Date, required: true },
    },
    { _id: false },
);

const makeupSimulationQuotaSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        reservations: {
            type: [makeupSimulationQuotaReservationSchema],
            default: () => [],
            select: false,
        },
    },
    {
        timestamps: true,
        collection: "makeupsimulationquotas",
    },
);

export const MakeupSimulationQuota =
    models.MakeupSimulationQuota ??
    model("MakeupSimulationQuota", makeupSimulationQuotaSchema);
