"use client";

import { Eye, EyeOff, PanelRightOpen, Trophy, X } from "lucide-react";
import type { GameState, Question } from "@/lib/types";
import { ScoreControls } from "./ScoreControls";
import { ResultsTable } from "./ResultsTable";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  resultsOpen: boolean;
  setResultsOpen: (open: boolean) => void;
  answerVisible: boolean;
  setAnswerVisible: (visible: boolean) => void;
  question: Question;
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  onNext: () => void;
};

export function HostPanel({ open, setOpen, resultsOpen, setResultsOpen, answerVisible, setAnswerVisible, question, state, setState, onNext }: Props) {
  if (!open) {
    return (
      <>
        <aside className="h-[calc(100vh-4rem)] w-[76px] shrink-0 p-4">
          <button className="btn btn-secondary h-11 w-11 p-0" type="button" aria-label="Показать панель ведущего" onClick={() => setOpen(true)}>
            <PanelRightOpen size={20} />
          </button>
        </aside>
        <ScoreResultsDialog open={resultsOpen} setOpen={setResultsOpen} state={state} />
      </>
    );
  }

  return (
    <>
      <aside className="flex h-[calc(100vh-4rem)] w-[240px] shrink-0 flex-col overflow-hidden rounded-lg bg-white/[0.045] p-3 shadow-xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="min-w-0 text-sm font-bold text-white/65">Начисление очков</h3>
          <div className="flex shrink-0 gap-2">
            <button className="btn btn-secondary h-10 w-10 p-0" type="button" aria-label="Результаты" onClick={() => setResultsOpen(true)}>
              <Trophy size={20} />
            </button>
            <button className="btn btn-secondary h-10 w-10 p-0" type="button" aria-label="Скрыть панель ведущего" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>
        <ScoreControls state={state} setState={setState} questionId={question.id} price={question.price} />
        <div className="mt-2 grid shrink-0 gap-2">
          {!answerVisible ? (
            <button className="btn btn-primary h-10 min-h-10 w-full text-sm" type="button" onClick={() => setAnswerVisible(true)}>
              <Eye size={18} /> Показать ответ
            </button>
          ) : (
            <>
              <button className="btn btn-primary h-10 min-h-10 w-full text-sm" type="button" onClick={onNext}>
                Далее
              </button>
              <button className="btn btn-secondary h-10 min-h-10 w-full text-sm" type="button" onClick={() => setAnswerVisible(false)}>
                <EyeOff size={18} /> Скрыть ответ
              </button>
            </>
          )}
        </div>
      </aside>

      <ScoreResultsDialog open={resultsOpen} setOpen={setResultsOpen} state={state} />
    </>
  );
}

export function ScoreResultsDialog({ open, setOpen, state }: { open: boolean; setOpen: (open: boolean) => void; state: GameState }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-5">
      <button className="absolute inset-0 bg-black/65" type="button" aria-label="Закрыть результаты" onClick={() => setOpen(false)} />
      <div className="panel relative z-10 max-h-[86vh] w-full max-w-5xl overflow-y-auto bg-[#09173a] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Результаты</h2>
          <button className="btn btn-secondary px-3" type="button" aria-label="Закрыть результаты" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <ResultsTable state={state} />
      </div>
    </div>
  );
}
