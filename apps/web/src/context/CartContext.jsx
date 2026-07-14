/**
 * Estado global e exclusivamente em memória do carrinho Orélle.
 *
 * O backend continua a ser a única fonte de verdade para preços, variantes e
 * stock. O provider publica apenas DTOs já confirmados e sobrevive à navegação
 * entre as shells pública autenticada e privada do cliente.
 */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import {
    addCartItem,
    deleteCartItem,
    getCart,
    updateCartItem,
} from "../services/cartApi.js";

const EMPTY_CART = Object.freeze({ items: Object.freeze([]), totalCents: 0 });
const FALLBACK_CART_CONTEXT = Object.freeze({
    cart: null,
    itemCount: 0,
    status: "idle",
    actionStatus: "idle",
    error: null,
    lastAction: null,
    isOpen: false,
    voucherCode: "",
    setVoucherCode() {},
    openCart() {},
    closeCart() {},
    async refreshCart() {
        return EMPTY_CART;
    },
    async addItem() {
        return null;
    },
    async addLines() {
        return null;
    },
    async updateQuantity() {
        return null;
    },
    async removeItem() {
        return null;
    },
});
const CartContext = createContext(FALLBACK_CART_CONTEXT);

/** Normaliza linhas bulk e remove repetições produto-variante. */
function normalizeCartLines(lines) {
    const uniqueLines = new Map();

    for (const candidate of lines ?? []) {
        const productId = String(candidate?.productId ?? "").trim();
        if (!productId) continue;
        const variantId = String(candidate?.variantId ?? "").trim();
        const quantity = Number.isInteger(candidate?.quantity)
            ? candidate.quantity
            : 1;

        uniqueLines.set(`${productId}:${variantId}`, {
            productId,
            ...(variantId ? { variantId } : {}),
            quantity,
        });
    }

    return [...uniqueLines.values()];
}

/**
 * Mantém o carrinho confirmado e coordena todas as mutações comerciais da UI.
 */
export function CartProvider({ children }) {
    const { user } = useAuth();
    const isClient = user?.role === "cliente";
    const userKey = isClient
        ? String(user?.id ?? user?._id ?? user?.email ?? "cliente")
        : "";
    const [cart, setCart] = useState(null);
    const [status, setStatus] = useState("idle");
    const [actionStatus, setActionStatus] = useState("idle");
    const [error, setError] = useState(null);
    const [lastAction, setLastAction] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [voucherCode, setVoucherCodeState] = useState("");
    const mutationInFlightRef = useRef(false);
    const operationControllerRef = useRef(null);
    const confirmedVersionRef = useRef(0);
    const refreshSequenceRef = useRef(0);

    const refreshCart = useCallback(
        async ({ signal } = {}) => {
            if (!isClient) return EMPTY_CART;
            const confirmedVersion = confirmedVersionRef.current;
            const refreshSequence = refreshSequenceRef.current + 1;
            refreshSequenceRef.current = refreshSequence;

            setStatus((current) =>
                ["idle", "error"].includes(current) ? "loading" : current,
            );
            setError(null);
            try {
                const nextCart = await getCart({ signal });
                if (
                    confirmedVersion !== confirmedVersionRef.current ||
                    refreshSequence !== refreshSequenceRef.current
                ) {
                    return nextCart;
                }
                setCart(nextCart);
                setStatus(nextCart.items.length > 0 ? "success" : "empty");
                return nextCart;
            } catch (requestError) {
                if (requestError?.code === "REQUEST_ABORTED") throw requestError;
                if (
                    confirmedVersion !== confirmedVersionRef.current ||
                    refreshSequence !== refreshSequenceRef.current
                ) {
                    return EMPTY_CART;
                }
                setError(requestError);
                setStatus("error");
                throw requestError;
            }
        },
        [isClient],
    );

    useEffect(() => {
        confirmedVersionRef.current += 1;
        refreshSequenceRef.current += 1;
        operationControllerRef.current?.abort();
        operationControllerRef.current = null;
        mutationInFlightRef.current = false;
        setCart(null);
        setStatus("idle");
        setActionStatus("idle");
        setError(null);
        setLastAction(null);
        setIsOpen(false);
        setVoucherCodeState("");

        if (!userKey) return undefined;
        const controller = new AbortController();
        void refreshCart({ signal: controller.signal }).catch(() => undefined);
        return () => {
            controller.abort();
            operationControllerRef.current?.abort();
        };
    }, [refreshCart, userKey]);

    const openCart = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeCart = useCallback(() => {
        setIsOpen(false);
    }, []);

    const setVoucherCode = useCallback((value) => {
        const normalized = String(value ?? "")
            .trimStart()
            .toUpperCase()
            .slice(0, 64);
        setVoucherCodeState(normalized);
    }, []);

    const addItem = useCallback(async (line) => {
        if (!isClient) return null;
        if (mutationInFlightRef.current) {
            setLastAction({
                kind: "busy",
                message: "Já existe uma alteração ao carrinho em curso.",
            });
            setIsOpen(true);
            return null;
        }
        const controller = new AbortController();
        operationControllerRef.current = controller;
        mutationInFlightRef.current = true;
        setActionStatus("loading");
        setError(null);
        setLastAction(null);

        try {
            const nextCart = await addCartItem(line, {
                signal: controller.signal,
            });
            confirmedVersionRef.current += 1;
            setCart(nextCart);
            setStatus(nextCart.items.length > 0 ? "success" : "empty");
            setActionStatus("success");
            setLastAction({
                kind: "add",
                addedCount: 1,
                requestedCount: 1,
                message: "Produto adicionado ao carrinho.",
            });
            return nextCart;
        } catch (requestError) {
            if (controller.signal.aborted) return null;
            setError(requestError);
            setActionStatus("error");
            setLastAction({
                kind: "add",
                addedCount: 0,
                requestedCount: 1,
                message: "O produto não foi adicionado.",
            });
            throw requestError;
        } finally {
            if (operationControllerRef.current === controller) {
                operationControllerRef.current = null;
            }
            mutationInFlightRef.current = false;
            if (!controller.signal.aborted) setIsOpen(true);
        }
    }, [isClient]);

    const addLines = useCallback(async (lines) => {
        if (!isClient) return null;
        if (mutationInFlightRef.current) {
            setLastAction({
                kind: "busy",
                message: "Já existe uma alteração ao carrinho em curso.",
            });
            setIsOpen(true);
            return null;
        }
        const normalizedLines = normalizeCartLines(lines);
        if (normalizedLines.length === 0) {
            setLastAction({
                kind: "bulk-add",
                addedCount: 0,
                requestedCount: 0,
                message: "Não existem produtos válidos para adicionar.",
            });
            setIsOpen(true);
            return null;
        }

        const controller = new AbortController();
        operationControllerRef.current = controller;
        mutationInFlightRef.current = true;
        setActionStatus("loading");
        setError(null);
        setLastAction(null);
        let addedCount = 0;

        try {
            let latestCart = cart;
            for (const line of normalizedLines) {
                latestCart = await addCartItem(line, {
                    signal: controller.signal,
                });
                addedCount += 1;
                confirmedVersionRef.current += 1;
                setCart(latestCart);
                setStatus(latestCart.items.length > 0 ? "success" : "empty");
            }
            setActionStatus("success");
            setLastAction({
                kind: "bulk-add",
                addedCount,
                requestedCount: normalizedLines.length,
                message: `${addedCount} de ${normalizedLines.length} adicionados.`,
            });
            return { cart: latestCart, addedCount, requestedCount: normalizedLines.length };
        } catch (requestError) {
            if (controller.signal.aborted) return null;
            setError(requestError);
            setActionStatus("error");
            setLastAction({
                kind: "bulk-add",
                addedCount,
                requestedCount: normalizedLines.length,
                message: `${addedCount} de ${normalizedLines.length} adicionados.`,
            });
            throw requestError;
        } finally {
            if (operationControllerRef.current === controller) {
                operationControllerRef.current = null;
            }
            mutationInFlightRef.current = false;
            if (!controller.signal.aborted) setIsOpen(true);
        }
    }, [cart, isClient]);

    const updateQuantity = useCallback(async (productId, variantId, quantity) => {
        if (!isClient || mutationInFlightRef.current) return null;
        const controller = new AbortController();
        operationControllerRef.current = controller;
        mutationInFlightRef.current = true;
        setActionStatus("loading");
        setError(null);

        try {
            const nextCart = await updateCartItem(
                productId,
                variantId,
                quantity,
                { signal: controller.signal },
            );
            confirmedVersionRef.current += 1;
            setCart(nextCart);
            setStatus(nextCart.items.length > 0 ? "success" : "empty");
            setActionStatus("success");
            setLastAction({ kind: "quantity", message: "Quantidade atualizada." });
            return nextCart;
        } catch (requestError) {
            if (controller.signal.aborted) return null;
            setError(requestError);
            setActionStatus("error");
            throw requestError;
        } finally {
            if (operationControllerRef.current === controller) {
                operationControllerRef.current = null;
            }
            mutationInFlightRef.current = false;
        }
    }, [isClient]);

    const removeItem = useCallback(async (productId, variantId) => {
        if (!isClient || mutationInFlightRef.current) return null;
        const controller = new AbortController();
        operationControllerRef.current = controller;
        mutationInFlightRef.current = true;
        setActionStatus("loading");
        setError(null);

        try {
            const nextCart = await deleteCartItem(productId, variantId, {
                signal: controller.signal,
            });
            confirmedVersionRef.current += 1;
            setCart(nextCart);
            setStatus(nextCart.items.length > 0 ? "success" : "empty");
            setActionStatus("success");
            setLastAction({ kind: "remove", message: "Produto removido do carrinho." });
            return nextCart;
        } catch (requestError) {
            if (controller.signal.aborted) return null;
            setError(requestError);
            setActionStatus("error");
            throw requestError;
        } finally {
            if (operationControllerRef.current === controller) {
                operationControllerRef.current = null;
            }
            mutationInFlightRef.current = false;
        }
    }, [isClient]);

    const itemCount = useMemo(
        () =>
            (cart?.items ?? []).reduce(
                (total, item) => total + Math.max(0, Number(item.quantity) || 0),
                0,
            ),
        [cart],
    );

    const value = useMemo(
        () => ({
            cart,
            itemCount,
            status,
            actionStatus,
            error,
            lastAction,
            isOpen,
            voucherCode,
            setVoucherCode,
            openCart,
            closeCart,
            refreshCart,
            addItem,
            addLines,
            updateQuantity,
            removeItem,
        }),
        [
            actionStatus,
            addItem,
            addLines,
            cart,
            closeCart,
            error,
            isOpen,
            itemCount,
            lastAction,
            openCart,
            refreshCart,
            removeItem,
            setVoucherCode,
            status,
            updateQuantity,
            voucherCode,
        ],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Lê o carrinho global; o fallback mantém componentes isolados não comerciais. */
// O hook vive junto do provider para manter o contrato público num único módulo.
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    return useContext(CartContext);
}
