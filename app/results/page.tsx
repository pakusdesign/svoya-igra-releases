"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { activeRound } from "@/lib/game";
import { ResultsTable } from "@/components/ResultsTable";
import { useGameState } from "@/lib/useGameState";

export default function ResultsPage() {
  const router = useRouter();
  const { state, setState, loaded } = useGameState();
  if (!loaded) return <main className="min-h-screen bg-board p-6">Загрузка...</main>;
  const round = activeRound(state);

  return (
    <main className="min-h-screen bg-board p-6 text-ink">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">Результаты</h1>
            <p className="text-white/65">{round ? `Раунд ${round.index}` : "Раунд не выбран"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-secondary" href="/game">
              Вернуться к игре
            </Link>
            <button className="btn btn-secondary" type="button" onClick={() => setState((current) => ({ ...current, status: "round-results" }))}>
              Завершить раунд
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                const currentIndex = state.rounds.findIndex((item) => item.id === round?.id);
                const next = state.rounds[currentIndex + 1];
                if (next) {
                  setState((current) => ({ ...current, activeRoundId: next.id, status: "playing" }));
                  router.push("/game");
                } else {
                  setState((current) => ({ ...current, status: "finished" }));
                  router.push("/final");
                }
              }}
            >
              Следующий раунд
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setState((current) => ({ ...current, status: "finished" }));
                router.push("/final");
              }}
            >
              Завершить игру
            </button>
          </div>
        </header>
        <div className="panel p-4">
          <ResultsTable state={state} />
        </div>
      </div>
    </main>
  );
}
