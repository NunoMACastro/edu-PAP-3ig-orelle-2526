/**
 * Script local para preparar um administrador.
 *
 * Usa `ADMIN_EMAIL` e `ADMIN_PASSWORD` vindos do ambiente. Nunca deve conter
 * passwords reais no repositorio.
 */
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { connectDB, disconnectDB } from "../config/db.js";
import { ROLES } from "../constants/roles.js";
import { User } from "../models/user.model.js";
import { assertDevelopmentSeedsAllowed } from "./seed-safety.js";

/**
 * Prepara um administrador local sem expor a credencial recebida.
 *
 * @async
 * @param {{email?: string, password?: string}} input - Credenciais apenas do ambiente local.
 * @returns {Promise<{email: string}>} Identificação não sensível do registo preparado.
 */
export async function seedAdmin({
    email = process.env.ADMIN_EMAIL,
    password = process.env.ADMIN_PASSWORD,
} = {}) {
    assertDevelopmentSeedsAllowed();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const passwordBytes = Buffer.byteLength(String(password ?? ""), "utf8");

    if (!normalizedEmail || passwordBytes < 12 || passwordBytes > 72) {
        throw new Error(
            "ADMIN_EMAIL e ADMIN_PASSWORD de 12 a 72 bytes são obrigatórios",
        );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.updateOne(
        { email: normalizedEmail },
        { $set: { passwordHash, role: ROLES.ADMIN } },
        { upsert: true },
    );

    return { email: normalizedEmail };
}

/**
 * Executa o seed de admin apenas como script standalone de desenvolvimento.
 *
 * @returns {Promise<void>} Resolve após fechar a ligação local.
 */
async function runSeedAdminScript() {
    assertDevelopmentSeedsAllowed();
    await connectDB();

    try {
        const result = await seedAdmin();
        console.log(`Admin preparado: ${result.email}`);
    } finally {
        await disconnectDB();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await runSeedAdminScript();
}
