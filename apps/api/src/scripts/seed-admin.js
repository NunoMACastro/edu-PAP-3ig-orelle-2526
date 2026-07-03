/**
 * Script local para preparar um administrador.
 *
 * Usa `ADMIN_EMAIL` e `ADMIN_PASSWORD` vindos do ambiente. Nunca deve conter
 * passwords reais no repositorio.
 */
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { ROLES } from "../constants/roles.js";
import { User } from "../models/user.model.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
    throw new Error(
        "ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios para criar admin",
    );
}

await connectDB();

const passwordHash = await bcrypt.hash(password, 12);

await User.updateOne(
    { email: email.trim().toLowerCase() },
    {
        $set: {
            passwordHash,
            role: ROLES.ADMIN,
        },
    },
    { upsert: true },
);

await disconnectDB();

console.log(`Admin preparado: ${email}`);
