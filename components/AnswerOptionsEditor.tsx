"use client";

import { Plus, Trash2 } from "lucide-react";
import { id } from "@/lib/game";
import type { AnswerOption } from "@/lib/types";

type AnswerOptionsEditorProps = {
  options: AnswerOption[];
  onChange: (options: AnswerOption[]) => void;
};

export function AnswerOptionsEditor({ options, onChange }: AnswerOptionsEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="admin-group-label">Варианты ответа</h4>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => onChange([...options, { id: id("option"), text: "", isCorrect: false }])}
        >
          <Plus size={18} /> Добавить
        </button>
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto]" key={option.id}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={option.isCorrect}
                onChange={(event) =>
                  onChange(options.map((item) => (item.id === option.id ? { ...item, isCorrect: event.target.checked } : item)))
                }
              />
              Верный
            </label>
            <input
              className="field"
              value={option.text}
              onChange={(event) =>
                onChange(options.map((item) => (item.id === option.id ? { ...item, text: event.target.value } : item)))
              }
            />
            <button
              aria-label="Удалить вариант"
              className="btn btn-secondary"
              type="button"
              onClick={() => onChange(options.filter((item) => item.id !== option.id))}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
