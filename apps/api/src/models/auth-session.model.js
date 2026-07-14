/**
 * Sessao opaca persistida da API Orelle.
 *
 * O cookie contem um token aleatorio de 256 bits. A base de dados guarda
 * apenas o respetivo hash HMAC, pelo que uma leitura da colecao nao revela
 * credenciais de sessao reutilizaveis.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const authSessionSchema = new Schema(
    {
        tokenHash: {
            type: String,
            required: true,
            unique: true,
            select: false,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        revokedAt: {
            type: Date,
            default: null,
            index: true,
        },
        lastSeenAt: {
            type: Date,
            required: true,
        },
        csrfHash: {
            type: String,
            default: null,
            select: false,
        },
    },
    { timestamps: true },
);

// O TTL remove sessoes expiradas de forma assinc. A verificacao de runtime
// continua a exigir `expiresAt > now`, porque o monitor TTL nao e imediato.
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

/**
 * Modelo Mongoose das sessoes opacas.
 *
 * @type {import("mongoose").Model}
 */
export const AuthSession = model("AuthSession", authSessionSchema);
