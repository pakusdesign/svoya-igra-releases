"use client";

import { Plus, Trash2 } from "lucide-react";
import { id, renumberRounds } from "@/lib/game";
import type { GameRound, GameState, Theme } from "@/lib/types";
import { AdminThemesEditor, type ThemeDropTarget } from "./AdminThemesEditor";
import { useState } from "react";

type Props = {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  themesDefaultCollapsed?: boolean;
};

export function AdminRoundsEditor({ state, setState, themesDefaultCollapsed = false }: Props) {
  const activeRound = state.rounds.find((round) => round.id === state.activeRoundId) ?? state.rounds[0];
  const [roundToDelete, setRoundToDelete] = useState<GameRound | null>(null);
  const [draggedTheme, setDraggedTheme] = useState<{ themeId: string; fromRoundId: string } | null>(null);
  const [themeDropTarget, setThemeDropTarget] = useState<ThemeDropTarget | null>(null);

  function updateRound(round: GameRound) {
    setState((current) => ({ ...current, rounds: current.rounds.map((item) => (item.id === round.id ? round : item)) }));
  }

  function moveTheme(target: ThemeDropTarget) {
    if (!draggedTheme) return;
    if (target.themeId === draggedTheme.themeId) return;

    setState((current) => {
      let movedTheme: Theme | undefined;
      const roundsWithoutMovedTheme = current.rounds.map((round) => {
        if (round.id !== draggedTheme.fromRoundId) return round;
        movedTheme = round.themes.find((theme) => theme.id === draggedTheme.themeId);
        return { ...round, themes: round.themes.filter((theme) => theme.id !== draggedTheme.themeId) };
      });

      if (!movedTheme) return current;
      const themeToMove = movedTheme;

      const rounds = roundsWithoutMovedTheme.map((round) => {
        if (round.id !== target.roundId) return round;

        const themes = [...round.themes];
        let insertIndex = themes.length;
        if (target.themeId) {
          const targetIndex = themes.findIndex((theme) => theme.id === target.themeId);
          if (targetIndex >= 0) insertIndex = target.position === "before" ? targetIndex : targetIndex + 1;
        }

        themes.splice(insertIndex, 0, themeToMove);
        return { ...round, themes };
      });

      return { ...current, rounds, activeRoundId: target.roundId };
    });

    setDraggedTheme(null);
    setThemeDropTarget(null);
  }

  function handleThemeDragEnd() {
    setDraggedTheme(null);
    setThemeDropTarget(null);
  }

  return (
    <section className="space-y-5" id="rounds">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="admin-title">Раунды, темы и вопросы</h2>
          <p className="admin-muted">Названия раундов формируются автоматически.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-1 border-b border-white/15">
        {state.rounds.map((round) => (
          <div
            className={`flex items-center rounded-t-lg border border-b-0 ${
              round.id === activeRound?.id
                ? "border-[var(--colorBrandBackground)] bg-[var(--colorBrandBackground)] text-[var(--colorNeutralForegroundOnBrand)]"
                : "border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground2)] text-[var(--colorNeutralForeground1)]"
            } ${
              themeDropTarget?.roundId === round.id && themeDropTarget.position === "end"
                ? "ring-2 ring-[var(--colorBrandBackground)] ring-offset-2 ring-offset-[var(--colorNeutralBackground1)]"
                : ""
            }`}
            key={round.id}
            onDragOver={(event) => {
              if (!draggedTheme) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setThemeDropTarget({ roundId: round.id, position: "end" });
            }}
            onDrop={(event) => {
              if (!draggedTheme) return;
              event.preventDefault();
              moveTheme({ roundId: round.id, position: "end" });
            }}
          >
            <button className="px-4 py-3 font-bold" type="button" onClick={() => setState((current) => ({ ...current, activeRoundId: round.id }))}>
              Раунд {round.index}
            </button>
            <button
              className="px-3 py-3"
              type="button"
              aria-label={`Удалить раунд ${round.index}`}
              onClick={() => {
                const hasQuestions = round.themes.some((theme) => theme.questions.length > 0);
                if (hasQuestions) {
                  setRoundToDelete(round);
                  return;
                }
                setState((current) => {
                  const rounds = renumberRounds(current.rounds.filter((item) => item.id !== round.id));
                  return { ...current, rounds, activeRoundId: rounds[0]?.id };
                });
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          className="mb-0 rounded-t-lg border border-b-0 border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground2)] px-4 py-3 font-bold text-[var(--colorNeutralForeground1)]"
          type="button"
          onClick={() =>
            setState((current) => {
              const round = { id: id("round"), index: current.rounds.length + 1, themes: [] };
              return { ...current, rounds: [...current.rounds, round], activeRoundId: round.id };
            })
          }
        >
          <Plus size={18} />
        </button>
      </div>
      {activeRound ? (
        <div className="space-y-4">
          <AdminThemesEditor
            round={activeRound}
            onChange={updateRound}
            defaultCollapsed={themesDefaultCollapsed}
            draggedThemeId={draggedTheme?.themeId}
            dropTarget={themeDropTarget}
            onThemeDragStart={(themeId, fromRoundId) => {
              setDraggedTheme({ themeId, fromRoundId });
              setThemeDropTarget(null);
            }}
            onThemeDragEnd={handleThemeDragEnd}
            onThemeDragOver={setThemeDropTarget}
            onThemeDrop={moveTheme}
          />
        </div>
      ) : (
        <div className="panel admin-muted p-6">Создайте первый раунд.</div>
      )}
      {roundToDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-5">
          <button className="absolute inset-0 bg-black/75" type="button" aria-label="Отмена" onClick={() => setRoundToDelete(null)} />
          <div className="panel relative z-10 w-full max-w-md p-6 shadow-2xl">
            <h3 className="admin-title mb-5">Вы действительно хотите удалить раунд?</h3>
            <div className="flex justify-end gap-3">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setState((current) => {
                    const rounds = renumberRounds(current.rounds.filter((round) => round.id !== roundToDelete.id));
                    return { ...current, rounds, activeRoundId: rounds[0]?.id };
                  });
                  setRoundToDelete(null);
                }}
              >
                Удалить
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setRoundToDelete(null)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
