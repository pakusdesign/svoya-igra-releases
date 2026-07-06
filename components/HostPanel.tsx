"use client";

import { Eye, EyeOff, PanelRightOpen, Trophy, X } from "lucide-react";
import type { GameState, Question } from "@/lib/types";
import { ScoreControls } from "./ScoreControls";
import { ResultsTable } from "./ResultsTable";
import { useState } from "react";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  answerVisible: boolean;
  setAnswerVisible: (visible: boolean) => void;
  question: Question;
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  onNext: () => void;
};

export function HostPanel({ open, setOpen, answerVisible, setAnswerVisible, question, state, setState, onNext }: Props) {
  const [resultsOpen, setResultsOpen] = useState(false);

  if (!open) {
    return (
      <button className="btn btn-secondary" type="button" onClick={() => setOpen(true)}>
        <PanelRightOpen size={20} /> Панель ведущего
      </button>
    );
  }

  return (
    <>
      <aside className="h-[calc(100vh-4rem)] w-full max-w-[460px] shrink-0 overflow-y-auto rounded-lg bg-white/[0.045] p-5 shadow-xl">
        <div className="mb-5 flex justify-end gap-2">
          <button className="btn btn-secondary px-3" type="button" aria-label="Результаты" onClick={() => setResultsOpen(true)}>
            <Trophy size={20} />
          </button>
          <button className="btn btn-secondary px-3" type="button" aria-label="Скрыть панель" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <h3 className="mb-3 text-lg font-bold text-white/65">Начисление очков</h3>
        <ScoreControls state={state} setState={setState} questionId={question.id} price={question.price} />
        <div className="mt-5 grid gap-2">
          {!answerVisible ? (
            <button className="btn btn-primary w-full" type="button" onClick={() => setAnswerVisible(true)}>
              <Eye size={18} /> Показать ответ
            </button>
          ) : (
            <>
              <button className="btn btn-primary w-full" type="button" onClick={onNext}>
                Далее
              </button>
              <button className="btn btn-secondary w-full" type="button" onClick={() => setAnswerVisible(false)}>
                <EyeOff size={18} /> Скрыть ответ
              </button>
            </>
          )}
        </div>
      </aside>

      {resultsOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center p-5">
          <button
            className="absolute inset-0 bg-black/65"
            type="button"
            aria-label="Закрыть результаты"
            onClick={() => setResultsOpen(false)}
          />
          <div className="panel relative z-10 max-h-[86vh] w-full max-w-5xl overflow-y-auto bg-[#09173a] p-5 shadow-2xl">
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
    </>
  );
}
