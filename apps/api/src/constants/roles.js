/**
 * Contrato canonico de roles do BK-MF0-05.
 *
 * Estes valores aparecem em modelos, middlewares e rotas administrativas. Ter
 * uma unica fonte evita escrever strings soltas como "admin" ou "moderador",
 * que nao existem no requisito RF05.
 */

/**
 * Roles permitidas pela MF0.
 *
 * @readonly
 * @type {{CLIENTE: "cliente", CONSULTOR: "consultor", ADMIN: "administrador"}}
 */
export const ROLES = Object.freeze({
    CLIENTE: "cliente",
    CONSULTOR: "consultor",
    ADMIN: "administrador",
});

/**
 * Lista usada em validacoes e schemas Mongoose.
 *
 * @readonly
 * @type {readonly string[]}
 */
export const ROLE_VALUES = Object.freeze(Object.values(ROLES));
