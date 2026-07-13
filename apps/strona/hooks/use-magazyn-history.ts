"use client";

import { useCallback, useMemo, useState } from "react";

const DEFAULT_MAX_DEPTH = 80;

function snapshotsEqual<T>(a: T, b: T): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

export type MagazynHistoryApi<T> = {
  state: T;
  setState: (updater: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Po udanym zapisie — nowa linia bazowa (czyści historię cofania). */
  commitSaved: (saved?: T) => void;
  isDirty: boolean;
};

/** Undo/redo dla edytorów panelu — wzorzec z syntance-web /magazyn/cennik. */
export function useMagazynHistory<T>(
  initial: T,
  options?: { maxDepth?: number },
): MagazynHistoryApi<T> {
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const [savedBaseline, setSavedBaseline] = useState(initial);
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState(initial);
  const [future, setFuture] = useState<T[]>([]);

  const setState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setPresent((current) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: T) => T)(current)
            : updater;
        if (snapshotsEqual(current, next)) return current;
        setPast((stack) => [...stack, current].slice(-maxDepth));
        setFuture([]);
        return next;
      });
    },
    [maxDepth],
  );

  const undo = useCallback(() => {
    setPast((stack) => {
      if (stack.length === 0) return stack;
      const previous = stack[stack.length - 1] as T;
      setPresent((current) => {
        setFuture((redoStack) => [current, ...redoStack].slice(0, maxDepth));
        return previous;
      });
      return stack.slice(0, -1);
    });
  }, [maxDepth]);

  const redo = useCallback(() => {
    setFuture((stack) => {
      if (stack.length === 0) return stack;
      const next = stack[0] as T;
      setPresent((current) => {
        setPast((undoStack) => [...undoStack, current].slice(-maxDepth));
        return next;
      });
      return stack.slice(1);
    });
  }, [maxDepth]);

  const commitSaved = useCallback((saved?: T) => {
    setPresent((current) => {
      const baseline = saved ?? current;
      setSavedBaseline(baseline);
      setPast([]);
      setFuture([]);
      return baseline;
    });
  }, []);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const isDirty = useMemo(
    () => !snapshotsEqual(present, savedBaseline),
    [present, savedBaseline],
  );

  return {
    state: present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    commitSaved,
    isDirty,
  };
}
