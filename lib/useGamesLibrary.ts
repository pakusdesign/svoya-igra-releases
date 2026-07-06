"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createInitialState, STORAGE_KEY } from "./game";
import { useGameState } from "./useGameState";
import type { GameState } from "./types";

export const GAMES_LIBRARY_KEY = "svoya-igra-games-library-v1";

export function useGamesLibrary() {
  const { state, setState, loaded: activeLoaded } = useGameState();
  const [games, setGames] = useState<GameState[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!activeLoaded) return;
    const raw = localStorage.getItem(GAMES_LIBRARY_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as GameState[];
        if (parsed.length) {
          setGames(parsed);
          setLoaded(true);
          return;
        }
      } catch {
        // Seed below.
      }
    }
    const initial = state.id ? state : createInitialState();
    setGames([initial]);
    localStorage.setItem(GAMES_LIBRARY_KEY, JSON.stringify([initial]));
    setLoaded(true);
  }, [activeLoaded]);

  const persistGames = useCallback((nextGames: GameState[]) => {
    setGames(nextGames);
    localStorage.setItem(GAMES_LIBRARY_KEY, JSON.stringify(nextGames));
  }, []);

  const selectGame = useCallback(
    (game: GameState) => {
      setState(game);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    },
    [setState]
  );

  const updateGame = useCallback(
    (gameId: string, next: React.SetStateAction<GameState>) => {
      const currentGame = games.find((game) => game.id === gameId);
      if (!currentGame) return;
      const resolvedGame = typeof next === "function" ? next(currentGame) : next;
      const updated = games.map((game) => (game.id === gameId ? resolvedGame : game));
      setGames(updated);
      localStorage.setItem(GAMES_LIBRARY_KEY, JSON.stringify(updated));
      if (state.id === gameId) setState(resolvedGame);
    },
    [games, setState, state.id]
  );

  return useMemo(
    () => ({ games, loaded: loaded && activeLoaded, activeState: state, setActiveState: setState, persistGames, selectGame, updateGame }),
    [games, loaded, activeLoaded, state, setState, persistGames, selectGame, updateGame]
  );
}
