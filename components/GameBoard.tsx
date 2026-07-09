"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { isGameFocusModeStored, storeGameFocusMode } from "@/lib/focusMode";
import { activeRound, DEFAULT_PRICES, isRoundComplete } from "@/lib/game";
import type { GameState } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { ResultsTable } from "./ResultsTable";

type Props = {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
};

export function GameBoard({ state, setState }: Props) {
  const router = useRouter();
  const round = activeRound(state);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [roundMenuOpen, setRoundMenuOpen] = useState(false);
  const [navigatingQuestionId, setNavigatingQuestionId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const enterFocusMode = useCallback(() => {
    storeGameFocusMode(true);
    setFocusMode(true);
    setMenuOpen(false);
    setRoundMenuOpen(false);
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  const leaveFocusMode = useCallback(() => {
    storeGameFocusMode(false);
    setFocusMode(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (document.fullscreenElement || isGameFocusModeStored()) {
      enterFocusMode();
    }
  }, [enterFocusMode]);

  useEffect(() => {
    if (!round) return;
    for (const question of round.themes.flatMap((theme) => theme.questions)) {
      router.prefetch(`/question/${question.id}`);
    }
  }, [round, router]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
      if (isTyping) return;

      const isFocusModeShortcut = event.code === "KeyM" || event.key.toLowerCase() === "m" || event.key.toLowerCase() === "м";
      if (isFocusModeShortcut) {
        event.preventDefault();
        if (focusMode) {
          leaveFocusMode();
        } else {
          enterFocusMode();
        }
        return;
      }

      if (event.key.toLowerCase() === "r" || event.key.toLowerCase() === "к") {
        event.preventDefault();
        setMenuOpen(false);
        setRoundMenuOpen(false);
        setResultsOpen((value) => !value);
        return;
      }

      if (event.key === "Escape") {
        if (resultsOpen) {
          event.preventDefault();
          setResultsOpen(false);
          return;
        }
        if (menuOpen) {
          event.preventDefault();
          setMenuOpen(false);
          return;
        }
        if (roundMenuOpen) {
          event.preventDefault();
          setRoundMenuOpen(false);
          return;
        }
        if (focusMode) {
          event.preventDefault();
          leaveFocusMode();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enterFocusMode, focusMode, leaveFocusMode, menuOpen, resultsOpen, roundMenuOpen]);

  useEffect(() => {
    function handleFullscreenChange() {
      const isFullscreen = Boolean(document.fullscreenElement);
      setFocusMode(isFullscreen);
      storeGameFocusMode(isFullscreen);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!round) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="panel max-w-xl p-6 text-center">
          <p className="mb-4">Игра ещё не настроена. Добавьте игроков, раунды, темы и вопросы в админке.</p>
          <Link className="btn btn-primary" href="/admin">
            Админка
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-board p-5 text-ink">
      {!focusMode ? (
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm uppercase tracking-widest text-white/60">Своя игра</div>
            <div className="relative mt-2 w-64">
              <button
                className="flex w-full items-center justify-between gap-4 rounded-lg border border-white/20 bg-[#0d2a66] px-4 py-3 text-left text-2xl font-black shadow-lg"
                type="button"
                aria-expanded={roundMenuOpen}
                onClick={() => setRoundMenuOpen((value) => !value)}
              >
                <span>
                  Раунд {round.index} из {state.rounds.length}
                </span>
                <ChevronDown className={`shrink-0 transition-transform duration-150 ${roundMenuOpen ? "rotate-180" : ""}`} size={24} />
              </button>
              {roundMenuOpen ? (
                <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-lg border border-white/20 bg-[#0b1b45] shadow-2xl">
                  {state.rounds.map((item) => (
                    <button
                      className={`block w-full px-4 py-3 text-left text-lg font-bold ${
                        item.id === round.id ? "bg-prize text-board" : "bg-[#0b1b45] text-white hover:bg-white/10"
                      }`}
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setState((current) => ({ ...current, activeRoundId: item.id, status: "playing" }));
                        setRoundMenuOpen(false);
                      }}
                    >
                      Раунд {item.index} из {state.rounds.length}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" type="button" onClick={() => setResultsOpen(true)}>
              Результаты
            </button>
            <button className="btn btn-secondary" type="button" aria-label="Открыть меню" onClick={() => setMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </header>
      ) : null}

      <section className={`overflow-x-auto rounded-lg border border-boardLine ${focusMode ? "h-[calc(100vh-2.5rem)]" : ""}`}>
        <div className={`min-w-[900px] ${focusMode ? "grid h-full" : ""}`} style={focusMode ? { gridTemplateRows: `repeat(${round.themes.length}, minmax(0, 1fr))` } : undefined}>
          {round.themes.map((theme) => (
            <div className="grid min-h-0 grid-cols-[260px_repeat(5,1fr)] border-b border-boardLine last:border-b-0" key={theme.id}>
              <div className="flex min-h-0 items-center bg-[#0d2a66] p-4 text-2xl font-black">{theme.title}</div>
              {DEFAULT_PRICES.map((price) => {
                const question = theme.questions.find((item) => item.price === price);
                const cellClass = `grid ${focusMode ? "min-h-0" : "min-h-28"} place-items-center border-l border-boardLine bg-board p-4 text-5xl font-black text-prize transition-colors ${
                  question?.isPlayed ? "opacity-30" : ""
                } ${navigatingQuestionId === question?.id ? "bg-[#102f73]" : ""}`;

                if (!question) {
                  return <div className={cellClass} key={price} />;
                }

                return (
                  <Link
                    className={cellClass}
                    href={`/question/${question.id}`}
                    key={price}
                    onPointerEnter={() => router.prefetch(`/question/${question.id}`)}
                    onClick={(event) => {
                      if (question.isPlayed && !window.confirm("Вопрос уже был выбран. Открыть повторно?")) {
                        event.preventDefault();
                        return;
                      }
                      setNavigatingQuestionId(question.id);
                      setState((current) => ({ ...current, activeQuestionId: question.id, status: "playing" }));
                    }}
                  >
                    {navigatingQuestionId === question.id ? "..." : price}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {isRoundComplete(round) ? (
        <div className="fixed inset-x-0 bottom-0 bg-prize p-3 text-center font-black text-board">
          Все вопросы раунда сыграны. Откройте результаты.
        </div>
      ) : null}

      {menuOpen ? (
        <div className="fixed inset-0 z-30">
          <button className="absolute inset-0 bg-black/50" type="button" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-sm border-l border-white/15 bg-[#09173a] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Меню</h2>
              <button
                className="btn btn-secondary absolute right-5 top-[33px]"
                type="button"
                aria-label="Закрыть меню"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-12 grid gap-3">
              <Link className="btn btn-secondary" href="/admin">
                Админка
              </Link>
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
          </aside>
        </div>
      ) : null}

      {resultsOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center p-5">
          <button
            className="absolute inset-0 bg-black/80"
            type="button"
            aria-label="Закрыть результаты"
            onClick={() => setResultsOpen(false)}
          />
          <div className="relative z-10 max-h-[86vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-white/25 bg-[#071331] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Результаты</h2>
              <button className="btn btn-secondary px-3" type="button" aria-label="Закрыть результаты" onClick={() => setResultsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <ResultsTable state={state} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
