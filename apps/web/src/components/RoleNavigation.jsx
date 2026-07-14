/**
 * Navegação autenticada adaptável da Orélle.
 *
 * O cliente usa progressive disclosure para reduzir a altura da sidebar. As
 * restantes roles preservam os grupos sempre visíveis. O componente é usado
 * tanto na sidebar como no drawer, mantendo o mesmo estado acessível.
 */
import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import {
    doesRoleNavigationItemMatch,
    getActiveRoleNavigationGroupId,
    isRoleNavigationItemActive,
} from "../services/roleAppNavigation.js";
import { NavIcon } from "./NavIcon.jsx";

/**
 * Renderiza um link com ícone e estado atual calculado pela configuração.
 *
 * @param {{item: object, navigation: object, pathname: string, onNavigate?: () => void, className?: string}} props - Dados do destino e contexto atual.
 * @returns {JSX.Element} Link de navegação acessível.
 */
export function RoleNavigationLink({
    item,
    navigation,
    pathname,
    onNavigate,
    className = "",
}) {
    const { itemCount, openCart } = useCart();
    const active = isRoleNavigationItemActive(navigation, item, pathname);
    const classes = [
        "role-navigation__link",
        className,
        active ? "role-navigation__link--active" : "",
    ].filter(Boolean).join(" ");

    if (item.action === "cart") {
        const badge = itemCount > 99 ? "99+" : String(itemCount);
        return (
            <button
                type="button"
                className={classes}
                aria-label={`Carrinho, ${itemCount} ${itemCount === 1 ? "unidade" : "unidades"}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                    openCart();
                    onNavigate?.();
                }}
            >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
                <span className="cart-count-badge" aria-hidden="true">
                    {badge}
                </span>
            </button>
        );
    }

    return (
        <Link
            to={item.to}
            className={classes}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
        >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
        </Link>
    );
}

/**
 * Renderiza um destino móvel que representa uma área funcional completa.
 *
 * @param {{item: object, pathname: string}} props - Destino e rota atual.
 * @returns {JSX.Element} Link da bottom navigation.
 */
export function RoleMobileNavigationLink({ item, pathname }) {
    const active = doesRoleNavigationItemMatch(item, pathname);

    return (
        <Link
            to={item.to}
            className={`role-navigation__link ${active ? "role-navigation__link--active" : ""}`}
            aria-current={active ? "page" : undefined}
        >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
        </Link>
    );
}

/**
 * Renderiza a apresentação histórica de grupos sempre expandidos.
 *
 * @param {{navigation: object, pathname: string, onNavigate?: () => void}} props - Configuração e callbacks da superfície.
 * @returns {JSX.Element} Navegação agrupada sem accordions.
 */
function StaticRoleNavigation({ navigation, pathname, onNavigate }) {
    return (
        <>
            {navigation.groups.map((navigationGroup) => (
                <div className="role-navigation__group" key={navigationGroup.id}>
                    <p>{navigationGroup.label}</p>
                    {navigationGroup.items.map((navigationItem) => (
                        <RoleNavigationLink
                            key={navigationItem.to}
                            item={navigationItem}
                            navigation={navigation}
                            pathname={pathname}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            ))}
        </>
    );
}

/**
 * Renderiza a navegação principal e sincroniza o accordion com a rota.
 *
 * Só um grupo pode estar aberto, mas o utilizador pode fechar o grupo atual. A
 * próxima alteração de rota volta a abrir automaticamente o grupo relevante.
 *
 * @param {{navigation: object, pathname: string, onNavigate?: () => void}} props - Configuração da role, rota e callback de navegação.
 * @returns {JSX.Element} Navegação apropriada à role.
 */
export function RoleNavigation({ navigation, pathname, onNavigate }) {
    const componentId = useId();
    const activeGroupId = getActiveRoleNavigationGroupId(navigation, pathname);
    const [openGroupId, setOpenGroupId] = useState(activeGroupId);

    useEffect(() => {
        setOpenGroupId(activeGroupId);
    }, [activeGroupId, pathname]);

    if (navigation.presentation !== "accordion") {
        return (
            <nav className="role-navigation" aria-label={`Navegação ${navigation.title}`}>
                <StaticRoleNavigation
                    navigation={navigation}
                    pathname={pathname}
                    onNavigate={onNavigate}
                />
            </nav>
        );
    }

    return (
        <nav
            className="role-navigation role-navigation--accordion"
            aria-label={`Navegação ${navigation.title}`}
        >
            {navigation.groups.map((navigationGroup) => {
                if (navigationGroup.direct) {
                    const directItem = navigationGroup.items[0];
                    return (
                        <div
                            className="role-navigation__group role-navigation__group--direct"
                            key={navigationGroup.id}
                        >
                            <RoleNavigationLink
                                item={directItem}
                                navigation={navigation}
                                pathname={pathname}
                                onNavigate={onNavigate}
                            />
                        </div>
                    );
                }

                const panelId = `${componentId}-${navigationGroup.id}`;
                const open = openGroupId === navigationGroup.id;
                const current = activeGroupId === navigationGroup.id;
                const toggleClasses = [
                    "role-navigation__toggle",
                    open ? "role-navigation__toggle--open" : "",
                    current ? "role-navigation__toggle--current" : "",
                ].filter(Boolean).join(" ");

                return (
                    <div
                        className="role-navigation__group role-navigation__group--accordion"
                        key={navigationGroup.id}
                    >
                        <button
                            type="button"
                            className={toggleClasses}
                            aria-expanded={open}
                            aria-controls={panelId}
                            onClick={() => setOpenGroupId((currentId) =>
                                currentId === navigationGroup.id
                                    ? null
                                    : navigationGroup.id,
                            )}
                        >
                            <NavIcon name={navigationGroup.icon} />
                            <span>{navigationGroup.label}</span>
                            <span className="role-navigation__chevron" aria-hidden="true">⌄</span>
                        </button>
                        <div
                            id={panelId}
                            className="role-navigation__panel"
                            hidden={!open}
                        >
                            {navigationGroup.items.map((navigationItem) => (
                                <RoleNavigationLink
                                    key={navigationItem.to}
                                    item={navigationItem}
                                    navigation={navigation}
                                    pathname={pathname}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </nav>
    );
}
