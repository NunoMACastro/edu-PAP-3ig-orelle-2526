/**
 * Drawer modal do carrinho global.
 *
 * A lista permanece inteiramente baseada no DTO confirmado pela API. O drawer
 * apenas apresenta e dispara operações do CartProvider, sem manter uma cópia
 * otimista ou persistir conteúdo comercial no browser.
 */
import { useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { ErrorSummary } from "./ErrorSummary.jsx";
import { NavIcon } from "./NavIcon.jsx";
import { OptimizedImage } from "./OptimizedImage.jsx";
import { Skeleton } from "./OrelleUi.jsx";

/** Formata cêntimos como moeda PT-PT. */
function formatPrice(priceCents) {
    return new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
    }).format(Number(priceCents ?? 0) / 100);
}

/** Produz um nome inequívoco para os controlos de uma linha. */
function getLineLabel(item) {
    return [item.name, item.variant?.label].filter(Boolean).join(", variante ");
}

/** Apresenta o carrinho como modal lateral em desktop e ecrã total em mobile. */
export function CartDrawer() {
    const titleId = useId();
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);
    const previousFocusRef = useRef(null);
    const navigate = useNavigate();
    const {
        cart,
        itemCount,
        status,
        actionStatus,
        error,
        lastAction,
        voucherCode,
        setVoucherCode,
        closeCart,
        refreshCart,
        updateQuantity,
        removeItem,
    } = useCart();
    const busy = actionStatus === "loading";
    const items = Array.isArray(cart?.items) ? cart.items : [];
    const badgeLabel = itemCount > 99 ? "99+" : String(itemCount);

    useEffect(() => {
        const dialog = dialogRef.current;
        previousFocusRef.current = document.activeElement;

        if (dialog && !dialog.open) {
            if (typeof dialog.showModal === "function") dialog.showModal();
            else dialog.setAttribute("open", "");
        }
        closeButtonRef.current?.focus();

        return () => {
            if (dialog?.open) {
                if (typeof dialog.close === "function") dialog.close();
                else dialog.removeAttribute("open");
            }
            if (previousFocusRef.current?.isConnected) {
                previousFocusRef.current.focus?.();
            }
        };
    }, []);

    /** Fecha apenas quando o ponteiro está realmente fora do painel. */
    function closeFromBackdrop(event) {
        if (event.target !== dialogRef.current) return;
        const bounds = dialogRef.current.getBoundingClientRect();
        const outside =
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom;
        if (outside) closeCart();
    }

    function continueToCheckout() {
        closeCart();
        navigate("/checkout");
    }

    return (
        <dialog
            ref={dialogRef}
            className="cart-drawer"
            aria-labelledby={titleId}
            aria-busy={busy}
            onCancel={(event) => {
                event.preventDefault();
                closeCart();
            }}
            onPointerDown={closeFromBackdrop}
        >
            <div className="cart-drawer__panel">
                <header className="cart-drawer__header">
                    <div>
                        <p className="app-kicker">Compras</p>
                        <h2 id={titleId}>Carrinho</h2>
                    </div>
                    <span
                        className="cart-count-badge cart-count-badge--large"
                        aria-label={`${itemCount} ${itemCount === 1 ? "unidade" : "unidades"}`}
                    >
                        {badgeLabel}
                    </span>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        className="cart-drawer__close"
                        onClick={closeCart}
                    >
                        <span>Fechar</span>
                        <span aria-hidden="true">×</span>
                    </button>
                </header>

                <div className="cart-drawer__announcements" aria-live="polite">
                    {busy ? (
                        <p role="status">A atualizar o carrinho…</p>
                    ) : lastAction?.message ? (
                        <p role="status">{lastAction.message}</p>
                    ) : null}
                </div>

                <ErrorSummary
                    error={error}
                    id="cart-drawer-error"
                    title="Não foi possível atualizar o carrinho"
                />

                {status === "loading" && !cart ? (
                    <div className="cart-drawer__body">
                        <Skeleton lines={5} label="A carregar carrinho" />
                    </div>
                ) : null}

                {status === "error" && !cart ? (
                    <div className="cart-drawer__empty">
                        <NavIcon name="cart" />
                        <h3>Não foi possível carregar o carrinho</h3>
                        <button
                            type="button"
                            onClick={() => void refreshCart().catch(() => undefined)}
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : null}

                {items.length === 0 && status !== "loading" && !(status === "error" && !cart) ? (
                    <div className="cart-drawer__empty">
                        <NavIcon name="cart" />
                        <h3>O carrinho está vazio</h3>
                        <p>Explora os produtos e guarda aqui as tuas escolhas.</p>
                        <button type="button" onClick={() => { closeCart(); navigate("/produtos"); }}>
                            Explorar produtos
                        </button>
                    </div>
                ) : null}

                {items.length > 0 ? (
                    <div className="cart-drawer__body">
                        <ul className="cart-drawer__items">
                            {items.map((item) => {
                                const lineLabel = getLineLabel(item);
                                return (
                                    <li key={`${item.productId}:${item.variantId ?? "base"}`}>
                                        <div className="cart-drawer__thumbnail">
                                            {item.variant?.imageUrl ? (
                                                <OptimizedImage
                                                    src={item.variant.imageUrl}
                                                    alt=""
                                                    width={68}
                                                    height={68}
                                                    sizes="68px"
                                                />
                                            ) : (
                                                <NavIcon name="bag" />
                                            )}
                                        </div>
                                        <div className="cart-drawer__item-copy">
                                            <strong>{item.name}</strong>
                                            {item.variant?.label ? <span>{item.variant.label}</span> : null}
                                            <span>{formatPrice(item.priceSnapshotCents)} por unidade</span>
                                            <div className="cart-drawer__quantity" aria-label={`Quantidade de ${lineLabel}`}>
                                                <button
                                                    type="button"
                                                    disabled={busy || item.quantity <= 1}
                                                    aria-label={`Diminuir quantidade de ${lineLabel}`}
                                                    onClick={() => void updateQuantity(item.productId, item.variantId, item.quantity - 1).catch(() => undefined)}
                                                >
                                                    −
                                                </button>
                                                <output aria-live="off">{item.quantity}</output>
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    aria-label={`Aumentar quantidade de ${lineLabel}`}
                                                    onClick={() => void updateQuantity(item.productId, item.variantId, item.quantity + 1).catch(() => undefined)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className="cart-drawer__item-actions">
                                            <strong>
                                                {formatPrice(
                                                    item.lineTotalCents ??
                                                        item.priceSnapshotCents *
                                                            item.quantity,
                                                )}
                                            </strong>
                                            <button
                                                type="button"
                                                className="text-link"
                                                disabled={busy}
                                                aria-label={`Remover ${lineLabel} do carrinho`}
                                                onClick={() => void removeItem(item.productId, item.variantId).catch(() => undefined)}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : null}

                {items.length > 0 ? (
                    <footer className="cart-drawer__footer">
                        <div className="cart-drawer__voucher">
                            <label htmlFor="cart-voucher-code">Voucher</label>
                            <input
                                id="cart-voucher-code"
                                type="text"
                                value={voucherCode}
                                maxLength={64}
                                autoComplete="off"
                                placeholder="Ex.: ORELLE-AB76A7B3"
                                aria-describedby="cart-voucher-help"
                                onChange={(event) =>
                                    setVoucherCode(event.target.value)
                                }
                            />
                            <small id="cart-voucher-help">
                                Opcional. O código é validado ao criares o resumo da encomenda.
                            </small>
                        </div>
                        <div>
                            <span>Total confirmado</span>
                            <strong>{formatPrice(cart.totalCents)}</strong>
                        </div>
                        <button type="button" onClick={continueToCheckout} disabled={busy}>
                            Continuar para confirmação
                        </button>
                        <p>O pagamento é exclusivamente simulado.</p>
                    </footer>
                ) : null}
            </div>
        </dialog>
    );
}
