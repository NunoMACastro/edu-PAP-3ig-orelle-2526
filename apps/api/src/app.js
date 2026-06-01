/**
 * Fabrica da aplicacao Express da MF0.
 *
 * `createApp` fica separado de `server.js` para permitir que os testes criem a
 * aplicacao sem abrir porta TCP nem ligar diretamente ao MongoDB.
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { adminUsersRoutes } from "./routes/admin-users.routes.js";
import { adminProductsRoutes } from "./routes/admin-products.routes.js";
import { adminCategoriesRoutes } from "./routes/admin-categories.routes.js";
import { preferencesRoutes } from "./routes/preferences.routes.js";
import { profileRoutes } from "./routes/profile.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

/**
 * Cria e configura uma instancia Express da API Orélle.
 *
 * @function createApp
 * @returns {import("express").Express} Aplicacao Express pronta a usar.
 */
export function createApp() {
    const app = express();

    app.use(cors({ origin: env.clientOrigin, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    // Endpoint simples para smoke tests e verificacao de arranque.
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", app: "orelle" });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/profile", profileRoutes);
    app.use("/api/preferences", preferencesRoutes);
    app.use("/api/admin", adminUsersRoutes);
    app.use("/api/admin", adminProductsRoutes);
    app.use("/api/admin", adminCategoriesRoutes);

    app.use(errorMiddleware);

    return app;
}
