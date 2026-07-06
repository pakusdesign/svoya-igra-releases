"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { createInitialState, STORAGE_KEY } from "./game";
import type { GameState } from "./types";

export function useGameState() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const stateRef = useRef(state);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as GameState;
        stateRef.current = parsed;
        setState(parsed);
      } catch {
        const initial = createInitialState();
        stateRef.current = initial;
        setState(initial);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    stateRef.current = state;
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [loaded, state]);

  const setPersistentState = useCallback<Dispatch<SetStateAction<GameState>>>((next) => {
    const resolved = typeof next === "function" ? next(stateRef.current) : next;
    stateRef.current = resolved;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
    setState(resolved);
  }, []);

  return useMemo(() => ({ state, setState: setPersistentState, loaded }), [state, loaded, setPersistentState]);
}
