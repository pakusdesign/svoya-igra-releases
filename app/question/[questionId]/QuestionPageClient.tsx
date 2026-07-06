"use client";

import { QuestionScreen } from "@/components/QuestionScreen";
import { useGameState } from "@/lib/useGameState";

export function QuestionPageClient({ questionId }: { questionId: string }) {
  const { state, setState, loaded } = useGameState();
  if (!loaded) return <main className="min-h-screen bg-board p-6">Загрузка...</main>;
  return <QuestionScreen state={state} setState={setState} questionId={questionId} />;
}
