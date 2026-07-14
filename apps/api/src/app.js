/**
 * Fabrica da aplicacao Express da MF0.
 *
 * `createApp` fica separado de `server.js` para permitir que os testes criem a
 * aplicacao sem abrir porta TCP nem ligar diretamente ao MongoDB.
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env, parseTrustedProxyCidrs } from "./config/env.js";
import { isTransactionalMongoReady } from "./config/db.js";
import { authRoutes } from "./routes/auth.routes.js";
import { aiConsultationRoutes } from "./routes/ai-consultation.routes.js";
import { aiConsultationReviewRoutes } from "./routes/ai-consultation-review.routes.js";
import { aiInteractionHistoryRoutes } from "./routes/ai-interaction-history.routes.js";
import { clientAiInsightRoutes } from "./routes/client-ai-insight.routes.js";
import { adminDashboardRoutes } from "./routes/admin-dashboard.routes.js";
import { adminExportRoutes } from "./routes/admin-export.routes.js";
import { adminReviewRoutes } from "./routes/admin-review.routes.js";
import { adminUsersRoutes } from "./routes/admin-users.routes.js";
import { adminProductsRoutes } from "./routes/admin-products.routes.js";
import { adminCategoriesRoutes } from "./routes/admin-categories.routes.js";
import { biometricAuditRoutes } from "./routes/biometric-audit.routes.js";
import { biometricDataRequestRoutes } from "./routes/biometric-data-request.routes.js";
import { cartRoutes } from "./routes/cart.routes.js";
import { catalogRoutes } from "./routes/catalog.routes.js";
import { dailyRoutineRoutes } from "./routes/daily-routine.routes.js";
import { facePhotoRoutes } from "./routes/face-photo.routes.js";
import { faceReportRoutes } from "./routes/face-report.routes.js";
import { makeupSimulationRoutes } from "./routes/makeup-simulation.routes.js";
import { cosmeticVisualizationRoutes } from "./routes/cosmetic-visualization.routes.js";
import { meAccountRoutes } from "./routes/me-account.routes.js";
import { preferencesRoutes } from "./routes/preferences.routes.js";
import { profileRoutes } from "./routes/profile.routes.js";
import { notificationRoutes } from "./routes/notification.routes.js";
import { recommendationRoutes } from "./routes/recommendation.routes.js";
import { orderRoutes } from "./routes/order.routes.js";
import { reorderRoutes } from "./routes/reorder.routes.js";
import { skinComparisonRoutes } from "./routes/skin-comparison.routes.js";
import { skinEvolutionRoutes } from "./routes/skin-evolution.routes.js";
import { skinHistoryRoutes } from "./routes/skin-history.routes.js";
import { stockRoutes } from "./routes/stock.routes.js";
import { routineAlertRoutes } from "./routes/routine-alert.routes.js";
import { voucherRoutes } from "./routes/voucher.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import {
    enforceHttpsTransport,
    securityTransportHeaders,
} from "./middlewares/security-transport.middleware.js";
import { requestTimeout } from "./middlewares/request-timeout.middleware.js";
import {
    requestContextMiddleware,
    requestMetricsMiddleware,
} from "./middlewares/request-observability.middleware.js";
import { createRateLimiters } from "./middlewares/rate-limit.middleware.js";
import { normalizeAllowedOrigins } from "./middlewares/csrf.middleware.js";

/**
 * Cria e configura uma instancia Express da API Orélle.
 *
 * @function createApp
 * @param {{readinessCheck?: () => boolean|Promise<boolean>, rateLimiters?: ReturnType<typeof createRateLimiters>, trustedProxies?: string[], allowedOrigins?: string[]}} [options] - Dependências operacionais injetáveis.
 * @returns {import("express").Express} Aplicacao Express pronta a usar.
 */
export function createApp({
    readinessCheck = () => isTransactionalMongoReady(),
    rateLimiters = createRateLimiters(),
    trustedProxies = env.trustedProxyCidrs,
    allowedOrigins = env.clientOrigins,
} = {}) {
    const app = express();
    const validatedTrustedProxies = parseTrustedProxyCidrs(
        trustedProxies.join(","),
    );
    const validatedAllowedOrigins = normalizeAllowedOrigins(allowedOrigins);

    app.set(
        "trust proxy",
        validatedTrustedProxies.length > 0
            ? validatedTrustedProxies
            : false,
    );
    app.locals.rateLimiters = rateLimiters;
    app.locals.csrfAllowedOrigins = validatedAllowedOrigins;

    app.use(requestContextMiddleware);
    // O HSTS continua condicional ao transporte validado no middleware abaixo;
    // os restantes headers do Helmet são seguros para respostas JSON.
    app.use(helmet({ strictTransportSecurity: false }));
    app.use(requestMetricsMiddleware);
    app.use(securityTransportHeaders);
    app.use(enforceHttpsTransport);
    app.use(requestTimeout());
    app.use(cors({ origin: validatedAllowedOrigins, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    /**
     * Liveness confirma apenas que o processo HTTP consegue responder. O alias
     * `/api/health` é preservado para compatibilidade com smokes existentes.
     */
    const livenessHandler = (req, res) => {
        res.json({ status: "ok", app: "orelle", checks: { http: "ok" } });
    };

    app.get("/api/health", livenessHandler);
    app.get("/api/health/live", livenessHandler);

    /**
     * Readiness só fica verde quando as dependências necessárias estão prontas.
     * A resposta não inclui URI, host, credenciais ou detalhes internos.
     */
    app.get("/api/health/ready", async (req, res, next) => {
        try {
            const mongoReady = await readinessCheck();

            return res.status(mongoReady ? 200 : 503).json({
                status: mongoReady ? "ready" : "not_ready",
                app: "orelle",
                checks: { mongodb: mongoReady ? "ok" : "unavailable" },
            });
        } catch (error) {
            return next(error);
        }
    });

    app.post("/api/auth/login", rateLimiters.login);
    app.post("/api/auth/register", rateLimiters.register);
    app.use("/api/auth", authRoutes);
    app.use("/api/me", meAccountRoutes);
    app.use("/api/profile", profileRoutes);
    app.use("/api/preferences", preferencesRoutes);
    app.use("/api/catalog", catalogRoutes);
    app.use("/api", facePhotoRoutes);
    app.use("/api", faceReportRoutes);
    app.use("/api", aiConsultationRoutes);
    app.use("/api", aiInteractionHistoryRoutes);
    app.use("/api", clientAiInsightRoutes);
    app.use("/api", skinHistoryRoutes);
    app.use("/api", skinEvolutionRoutes);
    app.use("/api", recommendationRoutes);
    app.use("/api", dailyRoutineRoutes);
    app.use("/api", aiConsultationReviewRoutes);
    app.use("/api", makeupSimulationRoutes);
    app.use("/api", cosmeticVisualizationRoutes);
    app.use("/api", skinComparisonRoutes);
    app.use("/api", biometricDataRequestRoutes);
    app.use("/api", cartRoutes);
    app.use("/api", orderRoutes);
    app.use("/api", reorderRoutes);
    app.use("/api", notificationRoutes);
    app.use("/api", routineAlertRoutes);
    app.use("/api", voucherRoutes);
    app.use("/api/admin", adminUsersRoutes);
    app.use("/api/admin", adminReviewRoutes);
    app.use("/api/admin", adminExportRoutes);
    app.use("/api/admin", adminProductsRoutes);
    app.use("/api/admin", adminCategoriesRoutes);
    app.use("/api/admin", adminDashboardRoutes);
    app.use("/api/admin", stockRoutes);
    app.use("/api/admin", biometricAuditRoutes);

    app.use(errorMiddleware);

    return app;
}
