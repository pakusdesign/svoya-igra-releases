"use client";

import { GameBoard } from "@/components/GameBoard";
import { useGameState } from "@/lib/useGameState";

export default function GamePage() {
  const { state, setState, loaded } = useGameState();
  if (!loaded) return <main className="min-h-screen bg-board p-6">Загрузка...</main>;
  return <GameBoard state={state} setState={setState} />;
}
