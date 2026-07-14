/**
 * Hook reutilizável para leituras assíncronas canceláveis e resistentes a races.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ASYNC_STATUS,
    createAsyncGenerationGate,
    isAsyncAbort,
    normalizeAsyncError,
} from "./asyncOperation.js";

/**
 * Estado padrão para recursos que não representam coleções.
 *
 * @returns {"success"} Estado de uma leitura concluída.
 */
function defaultStatusFromData() {
    return ASYNC_STATUS.SUCCESS;
}

/**
 * Gere uma leitura remota sem apagar dados válidos durante refresh ou erro.
 *
 * O `loader` recebe primeiro um contexto com `signal`; argumentos adicionais
 * enviados a `load` são encaminhados depois desse contexto. Cada nova leitura
 * cancela a anterior e invalida a respetiva geração, protegendo o estado mesmo
 * quando a dependência remota ignora o cancelamento.
 *
 * @template T
 * @param {(context: {signal: AbortSignal}, ...args: unknown[]) => Promise<T>} loader - Leitura assíncrona.
 * @param {object} [options] - Estado e resolução visual do recurso.
 * @param {T} [options.initialData=null] - Dados disponíveis antes da primeira leitura.
 * @param {string} [options.initialStatus="idle"] - Estado visual inicial.
 * @param {(data: T) => string} [options.statusFromData] - Estado após sucesso.
 * @returns {{data: T, status: string, error: Error|null, load: (...args: unknown[]) => Promise<object>, cancel: () => void, setData: (updater: T|((current: T) => T)) => void}} Contrato do recurso.
 */
export function useAsyncResource(loader, options = {}) {
    const {
        initialData = null,
        initialStatus = ASYNC_STATUS.IDLE,
        statusFromData = defaultStatusFromData,
    } = options;
    const loaderRef = useRef(loader);
    const statusFromDataRef = useRef(statusFromData);
    const generationRef = useRef(createAsyncGenerationGate());
    const activeControllerRef = useRef(null);
    const mountedRef = useRef(true);
    const hasSettledRef = useRef(false);
    const initialStatusRef = useRef(initialStatus);
    const [state, setState] = useState({
        data: initialData,
        status: initialStatus,
        error: null,
    });

    loaderRef.current = loader;
    statusFromDataRef.current = statusFromData;

    useEffect(() => {
        const generationGate = generationRef.current;
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            generationGate.invalidate();
            activeControllerRef.current?.abort();
            activeControllerRef.current = null;
        };
    }, []);

    const load = useCallback(async (...args) => {
        activeControllerRef.current?.abort();

        const controller = new AbortController();
        const generation = generationRef.current.next();
        activeControllerRef.current = controller;
        setState((current) => ({
            ...current,
            status: ASYNC_STATUS.LOADING,
            error: null,
        }));

        try {
            const data = await loaderRef.current(
                { signal: controller.signal },
                ...args,
            );

            if (
                !mountedRef.current ||
                !generationRef.current.isCurrent(generation)
            ) {
                return { ok: false, stale: true };
            }

            hasSettledRef.current = true;
            setState({
                data,
                status: statusFromDataRef.current(data),
                error: null,
            });
            return { ok: true, data };
        } catch (caughtError) {
            const stale = !generationRef.current.isCurrent(generation);
            const aborted = isAsyncAbort(caughtError, controller.signal);

            if (!mountedRef.current || stale || aborted) {
                return { ok: false, stale, aborted };
            }

            const error = normalizeAsyncError(caughtError);
            setState((current) => ({
                ...current,
                status: ASYNC_STATUS.ERROR,
                error,
            }));
            return { ok: false, error };
        } finally {
            if (activeControllerRef.current === controller) {
                activeControllerRef.current = null;
            }
        }
    }, []);

    const cancel = useCallback(() => {
        generationRef.current.invalidate();
        activeControllerRef.current?.abort();
        activeControllerRef.current = null;
        setState((current) => ({
            ...current,
            status: hasSettledRef.current
                ? statusFromDataRef.current(current.data)
                : initialStatusRef.current,
            error: null,
        }));
    }, []);

    const setData = useCallback((updater) => {
        hasSettledRef.current = true;
        setState((current) => {
            const data =
                typeof updater === "function" ? updater(current.data) : updater;

            return {
                data,
                status: statusFromDataRef.current(data),
                error: null,
            };
        });
    }, []);

    return {
        ...state,
        load,
        cancel,
        setData,
    };
}
