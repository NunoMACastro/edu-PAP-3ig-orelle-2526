/**
 * Script local para preparar utilizadores académicos de desenvolvimento.
 *
 * As contas usam emails `.test` e uma password controlada por
 * `SEED_USER_PASSWORD`. O script é idempotente, corre apenas em development e
 * nunca devolve ou escreve a password no output.
 */
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { ROLES } from "../constants/roles.js";
import { ACCOUNT_STATUSES, User } from "../models/user.model.js";
import { assertDevelopmentSeedsAllowed } from "./seed-safety.js";

export const DEMO_ADMIN_EMAIL = "admin@orelle.test";
const DEFAULT_SEED_PASSWORD = "OrelleDemo123!";

export const DEMO_USERS = [
    { email: DEMO_ADMIN_EMAIL, role: ROLES.ADMIN },
    { email: "consultor@orelle.test", role: ROLES.CONSULTOR },
    { email: "consultor.skincare@orelle.test", role: ROLES.CONSULTOR },
    { email: "cliente@orelle.test", role: ROLES.CLIENTE },
    { email: "cliente.maria@orelle.test", role: ROLES.CLIENTE },
    { email: "cliente.ines@orelle.test", role: ROLES.CLIENTE },
    { email: "cliente.joao@orelle.test", role: ROLES.CLIENTE },
    { email: "cliente.sofia@orelle.test", role: ROLES.CLIENTE },
];

/**
 * Devolve a password configurada para os utilizadores seedados.
 *
 * @function getSeedPassword
 * @returns {string} Password forte para ambiente local de desenvolvimento.
 * @throws {Error} Quando a password configurada e demasiado curta.
 */
function getSeedPassword() {
    const password = process.env.SEED_USER_PASSWORD ?? DEFAULT_SEED_PASSWORD;

    if (password.length < 12) {
        throw new Error("SEED_USER_PASSWORD deve ter pelo menos 12 caracteres");
    }

    return password;
}

/**
 * Cria ou atualiza utilizadores locais por email.
 *
 * @async
 * @function seedDemoUsers
 * @returns {Promise<object[]>} Utilizadores preparados sem credenciais no retorno.
 */
export async function seedDemoUsers() {
    assertDevelopmentSeedsAllowed();

    const password = getSeedPassword();
    const passwordHash = await bcrypt.hash(password, 12);
    const users = [];

    for (const user of DEMO_USERS) {
        users.push(
            await User.findOneAndUpdate(
                { email: user.email },
                {
                    $set: {
                        passwordHash,
                        role: user.role,
                        isActive: true,
                        accountStatus: ACCOUNT_STATUSES.ACTIVE,
                        suspendedAt: null,
                        deletedAt: null,
                    },
                },
                { upsert: true, new: true, runValidators: true },
            ),
        );
    }

    return users;
}

/**
 * Executa o seed de utilizadores como script standalone.
 *
 * @async
 * @function runSeedUsersScript
 * @returns {Promise<void>} Resolve quando o seed termina.
 */
async function runSeedUsersScript() {
    assertDevelopmentSeedsAllowed();
    await connectDB();

    try {
        const users = await seedDemoUsers();
        console.log(`Utilizadores locais preparados: ${users.length}`);
    } finally {
        await disconnectDB();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await runSeedUsersScript();
}
