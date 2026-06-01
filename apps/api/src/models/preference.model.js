/**
 * Modelo de preferencias do utilizador.
 *
 * Implementa o RF06 no BK-MF0-06: marcas favoritas e espaco preparado para
 * produtos favoritos, mantendo o ownership pelo utilizador autenticado.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Schema MongoDB das preferencias pessoais.
 *
 * A relacao por `userId` e unica para que cada utilizador tenha um unico
 * documento de preferencias.
 */
const preferenceSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        favoriteBrandNames: {
            type: [String],
            default: [],
        },
        favoriteProductIds: {
            type: [Schema.Types.ObjectId],
            ref: "Product",
            default: [],
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de preferencias.
 *
 * @type {import("mongoose").Model}
 */
export const Preference = model("Preference", preferenceSchema);
