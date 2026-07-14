/**
 * Rotas do titular para gestão irreversível da própria conta.
 *
 * O coordenador monta este router em `/api/me`. `requireAuth` também aplica a
 * quota autenticada e o contrato comum Origin + CSRF a este método mutável.
 */
import { Router } from "express";
import { eraseOwnAccountController } from "../controllers/account-erasure.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/** @type {import("express").Router} */
export const meAccountRoutes = Router();

meAccountRoutes.delete("/account", requireAuth, eraseOwnAccountController);
