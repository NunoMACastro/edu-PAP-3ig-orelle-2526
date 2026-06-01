/**
 * Middleware de erros partilhado por todos os BKs da MF0.
 *
 * A API usa `AppError` para erros esperados, como dados invalidos, falta de
 * sessao ou permissoes insuficientes. Erros inesperados continuam a devolver
 * uma mensagem generica para nao expor detalhes internos.
 */

/**
 * Erro controlado da aplicacao.
 *
 * @class
 * @extends Error
 */
export class AppError extends Error {
    /**
     * Cria um erro HTTP previsivel para controllers e validators.
     *
     * @param {number} statusCode - Codigo HTTP a devolver ao cliente.
     * @param {string} message - Mensagem segura para o cliente.
     * @param {Record<string, unknown>|undefined} [details] - Detalhes de validacao.
     */
    constructor(statusCode, message, details = undefined) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Converte erros da aplicacao numa resposta JSON uniforme.
 *
 * @function errorMiddleware
 * @param {Error & {statusCode?: number, details?: unknown}} err - Erro recebido.
 * @param {import("express").Request} req - Pedido Express original.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {import("express").Response|void} Resposta JSON ou delegacao se headers ja foram enviados.
 */
export function errorMiddleware(err, req, res, next) {
    if (res.headersSent) return next(err);

    const statusCode = err.statusCode ?? 500;
    const message =
        statusCode === 500 ? "Erro interno do servidor" : err.message;

    return res.status(statusCode).json({
        error: {
            message,
            details: err.details,
        },
    });
}
