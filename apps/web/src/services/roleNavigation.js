/**
 * Destinos de regresso seguros para cada role autenticada.
 *
 * O helper é partilhado pela home e pelo layout público para que um utilizador
 * nunca perca a ligação visível para a sua área depois de abrir o catálogo.
 */

const ROLE_HOME_DESTINATIONS = Object.freeze({
    cliente: Object.freeze({
        to: "/conta",
        label: "Área do cliente",
        shortLabel: "Conta",
        icon: "user",
    }),
    consultor: Object.freeze({
        to: "/consultoria/revisoes",
        label: "Área de consultoria",
        shortLabel: "Consultoria",
        icon: "review",
    }),
    administrador: Object.freeze({
        to: "/admin",
        label: "Área de administração",
        shortLabel: "Administração",
        icon: "dashboard",
    }),
});

/**
 * Resolve a área inicial de uma role reconhecida sem fallback permissivo.
 *
 * @param {string|undefined|null} role - Role pública da sessão.
 * @returns {{to: string, label: string, shortLabel: string, icon: string}|null} Destino permitido ou null.
 */
export function getRoleHomeDestination(role) {
    return ROLE_HOME_DESTINATIONS[role] ?? null;
}
