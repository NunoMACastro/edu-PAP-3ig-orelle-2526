export class AppError extends Error {
    constructor(statusCode, message, details = undefined) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.details = details;
    }
}


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