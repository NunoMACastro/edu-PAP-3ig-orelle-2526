/**
 * Ligacao MongoDB da API Orélle.
 *
 * O BK-MF0 usa MongoDB/Mongoose como camada de dados. Manter a ligacao num
 * modulo proprio permite reutilizar a mesma configuracao no servidor, testes e
 * scripts de seed sem duplicar detalhes de infraestrutura.
 */
import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Abre a ligacao principal ao MongoDB.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolve quando o Mongoose estiver ligado.
 */
export async function connectDB() {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.mongoUri);
}

/**
 * Fecha a ligacao principal ao MongoDB.
 *
 * @async
 * @function disconnectDB
 * @returns {Promise<void>} Resolve quando o Mongoose terminar a ligacao.
 */
export async function disconnectDB() {
    await mongoose.disconnect();
}
