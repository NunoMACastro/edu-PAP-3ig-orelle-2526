/**
 * Ligacao MongoDB da API Orélle.
 *
 * O BK-MF0 usa MongoDB/Mongoose como camada de dados. Manter a ligacao num
 * modulo proprio permite reutilizar a mesma configuracao no servidor, testes e
 * scripts de seed sem duplicar detalhes de infraestrutura.
 */
import mongoose from "mongoose";
import { env } from "./env.js";

/** Topologias MongoDB que garantem transações multi-documento. */
export const TRANSACTIONAL_MONGO_TOPOLOGIES = Object.freeze(
    new Set(["ReplicaSetWithPrimary", "Sharded", "LoadBalanced"]),
);

/**
 * Obtém o tipo de topologia sem expor hosts, URI ou credenciais.
 *
 * @param {typeof mongoose.connection|object} [connection=mongoose.connection] - Ligação Mongoose.
 * @returns {string} Tipo técnico sanitizado ou string vazia.
 */
export function getMongoTopologyType(connection = mongoose.connection) {
    return String(connection?.client?.topology?.description?.type ?? "");
}

/**
 * Confirma simultaneamente ligação e suporte transacional.
 *
 * @param {typeof mongoose.connection|object} [connection=mongoose.connection] - Ligação candidata.
 * @returns {boolean} Verdadeiro apenas com primary/transações disponíveis.
 */
export function isTransactionalMongoReady(connection = mongoose.connection) {
    return (
        connection?.readyState === 1 &&
        TRANSACTIONAL_MONGO_TOPOLOGIES.has(getMongoTopologyType(connection))
    );
}

/**
 * Impede que a API anuncie disponibilidade sobre MongoDB standalone.
 *
 * @param {typeof mongoose.connection|object} [connection=mongoose.connection] - Ligação candidata.
 * @returns {void}
 * @throws {Error} Quando não existem transações multi-documento.
 */
export function assertTransactionalMongoReady(connection = mongoose.connection) {
    if (!isTransactionalMongoReady(connection)) {
        throw new Error("MongoDB com replica set e primary é obrigatório");
    }
}

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

    try {
        assertTransactionalMongoReady();
    } catch (error) {
        await mongoose.disconnect().catch(() => undefined);
        throw error;
    }
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

/**
 * Expõe o client já validado apenas a scripts internos de migração.
 *
 * @returns {import("mongodb").MongoClient} Client da ligação principal.
 */
export function getDatabaseClient() {
    assertTransactionalMongoReady();
    return mongoose.connection.getClient();
}

/**
 * Expõe a base ativa apenas depois de confirmar o contrato transacional.
 *
 * @returns {import("mongodb").Db} Base MongoDB principal.
 */
export function getDatabase() {
    assertTransactionalMongoReady();
    return mongoose.connection.db;
}
