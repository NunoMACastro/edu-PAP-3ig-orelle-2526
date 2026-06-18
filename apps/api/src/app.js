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
import { adminDashboardRoutes } from "./routes/admin-dashboard.routes.js";
import { adminUsersRoutes } from "./routes/admin-users.routes.js";
import { adminProductsRoutes } from "./routes/admin-products.routes.js";
import { adminCategoriesRoutes } from "./routes/admin-categories.routes.js";
import { beforeAfterVisualizationRoutes } from "./routes/before-after-visualization.routes.js";
import { cartRoutes } from "./routes/cart.routes.js";
import { catalogRoutes } from "./routes/catalog.routes.js";
import { dailyRoutineRoutes } from "./routes/daily-routine.routes.js";
import { faceAnalysisRoutes } from "./routes/face-analysis.routes.js";
import { facePhotoRoutes } from "./routes/face-photo.routes.js";
import { faceReportRoutes } from "./routes/face-report.routes.js";
import { makeupSimulationRoutes } from "./routes/makeup-simulation.routes.js";
import { preferencesRoutes } from "./routes/preferences.routes.js";
import { profileRoutes } from "./routes/profile.routes.js";
import { recommendationReviewRoutes } from "./routes/recommendation-review.routes.js";
import { recommendationRoutes } from "./routes/recommendation.routes.js";
import { orderRoutes } from "./routes/order.routes.js";
import { reorderRoutes } from "./routes/reorder.routes.js";
import { skinComparisonRoutes } from "./routes/skin-comparison.routes.js";
import { skinEvolutionRoutes } from "./routes/skin-evolution.routes.js";
import { skinHistoryRoutes } from "./routes/skin-history.routes.js";
import { stockRoutes } from "./routes/stock.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { adminReviewRoutes } from "./routes/admin-review.routes.js";
import { adminExportRoutes } from "./routes/admin-export.routes.js";
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
    app.use("/api/catalog", catalogRoutes);
    app.use("/api", facePhotoRoutes);
    app.use("/api", faceAnalysisRoutes);
    app.use("/api", faceReportRoutes);
    app.use("/api", skinHistoryRoutes);
    app.use("/api", skinEvolutionRoutes);
    app.use("/api", recommendationRoutes);
    app.use("/api", dailyRoutineRoutes);
    app.use("/api", recommendationReviewRoutes);
    app.use("/api", makeupSimulationRoutes);
    app.use("/api", beforeAfterVisualizationRoutes);
    app.use("/api", skinComparisonRoutes);
    app.use("/api", cartRoutes);
    app.use("/api", orderRoutes);
    app.use("/api", reorderRoutes);
    app.use("/api/admin", adminUsersRoutes);
    app.use("/api/admin", adminProductsRoutes);
    app.use("/api/admin", adminCategoriesRoutes);
    app.use("/api/admin", adminDashboardRoutes);
    app.use("/api/admin", stockRoutes);
    app.use("/api/admin", adminReviewRoutes);
    app.use("/api/admin", adminExportRoutes);

    app.use(errorMiddleware);

    return app;
}
