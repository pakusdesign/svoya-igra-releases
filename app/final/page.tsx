"use client";

import Link from "next/link";
import { ResultsTable } from "@/components/ResultsTable";
import { useGameState } from "@/lib/useGameState";

export default function FinalPage() {
  const { state, loaded } = useGameState();
  if (!loaded) return <main className="min-h-screen bg-board p-6">Загрузка...</main>;

  return (
    <main className="min-h-screen bg-board p-6 text-ink">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-5xl font-black">Финальные результаты</h1>
            <p className="text-white/65">История игры: {state.rounds.length} раунд(ов), {state.scoreEvents.length} действий со счётом.</p>
          </div>
          <Link className="btn btn-secondary" href="/">
            Закрыть
          </Link>
        </header>
        <div className="panel p-4">
          <ResultsTable state={state} final />
        </div>
      </div>
    </main>
  );
}
