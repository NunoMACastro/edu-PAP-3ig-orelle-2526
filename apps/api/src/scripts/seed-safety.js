/**
 * Guard comum para impedir seeds fora do ambiente académico de desenvolvimento.
 */
import { ENVIRONMENT_NAMES, env } from "../config/env.js";

/**
 * Indica se o nome de ambiente permite operações de seed.
 *
 * @param {string} nodeEnv - Nome do ambiente a avaliar.
 * @returns {boolean} `true` apenas para development.
 */
export function isDevelopmentSeedEnvironment(nodeEnv) {
    return nodeEnv === ENVIRONMENT_NAMES.DEVELOPMENT;
}

/**
 * Recusa qualquer seed fora de development antes de abrir ligações ou escrever.
 *
 * @returns {void}
 * @throws {Error} Quando o runtime não é development.
 */
export function assertDevelopmentSeedsAllowed() {
    if (!isDevelopmentSeedEnvironment(env.nodeEnv)) {
        throw new Error(
            "Seeds são permitidas apenas em NODE_ENV=development no alvo académico/local",
        );
    }
}
