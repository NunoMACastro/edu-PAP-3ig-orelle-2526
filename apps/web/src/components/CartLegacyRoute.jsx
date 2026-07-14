/** Compatibilidade para bookmarks antigos da página autónoma do carrinho. */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

/** Abre o drawer e substitui `/carrinho` pelo catálogo sem perder o provider. */
export function CartLegacyRoute() {
    const navigate = useNavigate();
    const { openCart } = useCart();

    useEffect(() => {
        navigate("/produtos", { replace: true });
        // O provider termina primeiro a limpeza associada ao bootstrap da sessão.
        // A abertura no microtask seguinte evita que essa limpeza feche o drawer
        // pedido explicitamente pelo deep link legacy.
        queueMicrotask(openCart);
    }, [navigate, openCart]);

    return <p role="status">A abrir o carrinho…</p>;
}
