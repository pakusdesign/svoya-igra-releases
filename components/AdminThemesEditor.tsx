"use client";

import { Check, ChevronDown, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { DEFAULT_PRICES, id } from "@/lib/game";
import type { GameRound, Theme } from "@/lib/types";
import { AdminQuestionsEditor } from "./AdminQuestionsEditor";
import { useState } from "react";

export type ThemeDropTarget = {
  roundId: string;
  themeId?: string;
  position: "before" | "after" | "end";
};

type Props = {
  round: GameRound;
  onChange: (round: GameRound) => void;
  defaultCollapsed?: boolean;
  draggedThemeId?: string | null;
  dropTarget?: ThemeDropTarget | null;
  onThemeDragStart?: (themeId: string, roundId: string) => void;
  onThemeDragEnd?: () => void;
  onThemeDragOver?: (target: ThemeDropTarget) => void;
  onThemeDrop?: (target: ThemeDropTarget) => void;
};

export function AdminThemesEditor({
  round,
  onChange,
  defaultCollapsed = false,
  draggedThemeId,
  dropTarget,
  onThemeDragStart,
  onThemeDragEnd,
  onThemeDragOver,
  onThemeDrop
}: Props) {
  const [collapsedThemeIds, setCollapsedThemeIds] = useState<string[]>(defaultCollapsed ? round.themes.map((theme) => theme.id) : []);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);

  function updateTheme(theme: Theme) {
    onChange({ ...round, themes: round.themes.map((item) => (item.id === theme.id ? theme : item)) });
  }

  function createTheme(): Theme {
    return {
      id: id("theme"),
      title: "Новая тема",
      questions: DEFAULT_PRICES.map((price) => ({
        id: id("question"),
        price,
        text: "",
        answerText: "",
        answerFormat: "open",
        answerOptions: [],
        isPlayed: false
      }))
    };
  }

  function themeDropPosition(event: React.DragEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
  }

  function handleDragStart(event: React.DragEvent<HTMLElement>, themeId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", themeId);
    onThemeDragStart?.(themeId, round.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="admin-group-label">Темы</h3>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => onChange({ ...round, themes: [createTheme(), ...round.themes] })}
        >
          <Plus size={18} /> Добавить тему
        </button>
      </div>
      {round.themes.map((theme) => {
        const collapsed = collapsedThemeIds.includes(theme.id);
        const isDragging = draggedThemeId === theme.id;
        const isDropBefore = dropTarget?.roundId === round.id && dropTarget.themeId === theme.id && dropTarget.position === "before";
        const isDropAfter = dropTarget?.roundId === round.id && dropTarget.themeId === theme.id && dropTarget.position === "after";
        return (
        <div
          className={`panel space-y-4 p-5 transition ${
            isDragging ? "opacity-45" : ""
          } ${isDropBefore ? "border-t-4 border-t-[var(--colorBrandBackground)]" : ""} ${
            isDropAfter ? "border-b-4 border-b-[var(--colorBrandBackground)]" : ""
          }`}
          key={theme.id}
          onDragOver={(event) => {
            if (!draggedThemeId || draggedThemeId === theme.id) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            onThemeDragOver?.({ roundId: round.id, themeId: theme.id, position: themeDropPosition(event) });
          }}
          onDrop={(event) => {
            if (!draggedThemeId || draggedThemeId === theme.id) return;
            event.preventDefault();
            onThemeDrop?.({ roundId: round.id, themeId: theme.id, position: themeDropPosition(event) });
          }}
        >
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="flex min-w-0 items-center gap-2">
              <button
                className="grid min-h-10 min-w-10 shrink-0 cursor-grab place-items-center rounded border border-transparent bg-transparent text-[var(--colorNeutralForeground3)] transition hover:bg-[var(--colorNeutralBackground3)] hover:text-[var(--colorNeutralForeground1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--colorBrandStroke1)] active:cursor-grabbing"
                type="button"
                aria-label={`Перетащить тему ${theme.title || "Без названия"}`}
                draggable
                onDragStart={(event) => handleDragStart(event, theme.id)}
                onDragEnd={onThemeDragEnd}
              >
                <GripVertical size={18} />
              </button>
              <button
                className="flex min-w-0 items-center gap-2 text-left"
                type="button"
                onClick={() =>
                  setCollapsedThemeIds((current) =>
                    current.includes(theme.id) ? current.filter((id) => id !== theme.id) : [...current, theme.id]
                  )
                }
              >
                <ChevronDown className={`admin-accent shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`} size={22} />
                <span className="admin-subtitle admin-accent break-words">{theme.title || "Без названия"}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-secondary" type="button" aria-label="Редактировать тему" onClick={() => setEditingThemeId(theme.id)}>
                <Pencil size={18} />
              </button>
              <button
                className="btn btn-secondary"
                aria-label="Удалить тему"
                type="button"
                onClick={() => onChange({ ...round, themes: round.themes.filter((item) => item.id !== theme.id) })}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          {editingThemeId === theme.id ? (
            <label className="block">
              <span className="admin-muted mb-1 block text-sm">Название темы</span>
              <div className="flex gap-2">
                <input className="field text-xl font-bold" value={theme.title} onChange={(event) => updateTheme({ ...theme, title: event.target.value })} />
                <button className="btn btn-primary px-3" type="button" aria-label="Сохранить название темы" onClick={() => setEditingThemeId(null)}>
                  <Check size={18} />
                </button>
                <button className="btn btn-secondary px-3" type="button" aria-label="Отмена редактирования темы" onClick={() => setEditingThemeId(null)}>
                  <X size={18} />
                </button>
              </div>
            </label>
          ) : null}
          {!collapsed ? <AdminQuestionsEditor theme={theme} onChange={updateTheme} /> : null}
        </div>
        );
      })}
      {!round.themes.length ? (
        <div
          className={`panel admin-muted border-dashed p-6 ${dropTarget?.roundId === round.id && dropTarget.position === "end" ? "border-[var(--colorBrandBackground)]" : ""}`}
          onDragOver={(event) => {
            if (!draggedThemeId) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            onThemeDragOver?.({ roundId: round.id, position: "end" });
          }}
          onDrop={(event) => {
            if (!draggedThemeId) return;
            event.preventDefault();
            onThemeDrop?.({ roundId: round.id, position: "end" });
          }}
        >
          Перетащите тему сюда или добавьте новую тему.
        </div>
      ) : null}
    </div>
  );
}
