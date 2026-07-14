/**
 * Hook reutilizável para mutações assíncronas isoladas das leituras da página.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ASYNC_STATUS,
    createAsyncGenerationGate,
    isAsyncAbort,
    normalizeAsyncError,
} from "./asyncOperation.js";

/**
 * Executa uma mutação cancelável e impede resultados antigos de vencerem races.
 *
 * O estado/resultados da ação são independentes do recurso apresentado pela
 * página. Assim, uma falha de mutação não elimina conteúdo carregado. O
 * callback recebe `{ signal }` antes dos argumentos enviados a `run`.
 *
 * @template T
 * @param {(context: {signal: AbortSignal}, ...args: unknown[]) => Promise<T>} action - Mutação assíncrona.
 * @param {object} [options] - Configuração inicial.
 * @param {T|null} [options.initialResult=null] - Último resultado conhecido.
 * @returns {{result: T|null, status: string, error: Error|null, run: (...args: unknown[]) => Promise<object>, cancel: () => void, reset: () => void}} Contrato da ação.
 */
export function useAsyncAction(action, options = {}) {
    const { initialResult = null } = options;
    const actionRef = useRef(action);
    const initialResultRef = useRef(initialResult);
    const generationRef = useRef(createAsyncGenerationGate());
    const activeControllerRef = useRef(null);
    const mountedRef = useRef(true);
    const [state, setState] = useState({
        result: initialResult,
        status: ASYNC_STATUS.IDLE,
        error: null,
    });

    actionRef.current = action;

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

    const run = useCallback(async (...args) => {
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
            const result = await actionRef.current(
                { signal: controller.signal },
                ...args,
            );

            if (
                !mountedRef.current ||
                !generationRef.current.isCurrent(generation)
            ) {
                return { ok: false, stale: true };
            }

            setState({
                result,
                status: ASYNC_STATUS.SUCCESS,
                error: null,
            });
            return { ok: true, data: result };
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
            status: ASYNC_STATUS.IDLE,
            error: null,
        }));
    }, []);

    const reset = useCallback(() => {
        generationRef.current.invalidate();
        activeControllerRef.current?.abort();
        activeControllerRef.current = null;
        setState({
            result: initialResultRef.current,
            status: ASYNC_STATUS.IDLE,
            error: null,
        });
    }, []);

    return {
        ...state,
        run,
        cancel,
        reset,
    };
}
