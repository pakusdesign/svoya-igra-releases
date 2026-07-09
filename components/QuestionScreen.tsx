"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { answerIncludesText, answerMediaType, getAnswerType } from "@/lib/answerTypes";
import { isGameFocusModeStored, storeGameFocusMode } from "@/lib/focusMode";
import { activeRound, findQuestion, isRoundComplete } from "@/lib/game";
import type { GameState } from "@/lib/types";
import { HostPanel, ScoreResultsDialog } from "./HostPanel";
import { TimerLoader } from "./TimerLoader";
import { useCallback, useEffect, useState } from "react";

type Props = {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  questionId: string;
};

function embedUrl(url?: string) {
  if (!url) return undefined;
  if (url.includes("youtube.com/embed/")) return url;
  const watch = url.match(/[?&]v=([^&]+)/)?.[1];
  if (watch) return `https://www.youtube.com/embed/${watch}`;
  const short = url.match(/youtu\.be\/([^?]+)/)?.[1];
  if (short) return `https://www.youtube.com/embed/${short}`;
  return url;
}

export function QuestionScreen({ state, setState, questionId }: Props) {
  const router = useRouter();
  const found = findQuestion(state, questionId);
  const [hostOpen, setHostOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const enterFocusMode = useCallback(() => {
    storeGameFocusMode(true);
    setFocusMode(true);
    setHostOpen(false);
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  const leaveFocusMode = useCallback(() => {
    storeGameFocusMode(false);
    setFocusMode(false);
    setHostOpen(true);
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

      if (event.key === "Enter" || event.code === "NumpadEnter") {
        event.preventDefault();
        setAnswerVisible(true);
        return;
      }

      if (event.key.toLowerCase() === "r" || event.key.toLowerCase() === "к") {
        event.preventDefault();
        setResultsOpen((value) => !value);
        return;
      }

      if (event.code === "Space" || event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        setHostOpen((value) => !value);
        return;
      }

      if (event.key === "Escape") {
        if (expandedImage) {
          event.preventDefault();
          setExpandedImage(null);
          return;
        }
        if (resultsOpen) {
          event.preventDefault();
          setResultsOpen(false);
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
  }, [enterFocusMode, expandedImage, focusMode, leaveFocusMode, resultsOpen]);

  useEffect(() => {
    function handleFullscreenChange() {
      const isFullscreen = Boolean(document.fullscreenElement);
      setFocusMode(isFullscreen);
      storeGameFocusMode(isFullscreen);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!found) {
    return (
      <main className="grid min-h-screen place-items-center bg-board p-6">
        <div className="panel p-6">Вопрос не найден.</div>
      </main>
    );
  }

  const { theme, question } = found;
  const answerType = getAnswerType(question);
  const answerMedia = answerMediaType(answerType);
  const answerText = answerIncludesText(answerType)
    ? question.answerText ||
      (question.answerOptions ?? [])
        .filter((option) => option.isCorrect)
        .map((option) => option.text)
        .join(", ")
    : "";
  const answerVideoUrl = embedUrl(question.answerVideoUrl);
  const hasQuestionMedia = Boolean(question.imageUrl || question.audioUrl || question.videoUrl);

  function returnToBoard() {
    setState((current) => {
      const rounds = current.rounds.map((round) => ({
        ...round,
        themes: round.themes.map((item) => ({
          ...item,
          questions: item.questions.map((entry) => (entry.id === question.id ? { ...entry, isPlayed: true } : entry))
        }))
      }));
      const nextState = { ...current, rounds, activeQuestionId: undefined };
      const round = activeRound(nextState);
      return { ...nextState, status: isRoundComplete(round) ? "round-results" : "playing" };
    });
    const currentRound = activeRound({
      ...state,
      rounds: state.rounds.map((round) => ({
        ...round,
        themes: round.themes.map((item) => ({
          ...item,
          questions: item.questions.map((entry) => (entry.id === question.id ? { ...entry, isPlayed: true } : entry))
        }))
      }))
    });
    router.push(isRoundComplete(currentRound) ? "/results" : "/game");
  }

  function renderAnswerBlock(isOverlay = false) {
    return (
      <div className={`flex flex-col rounded-lg border-2 border-prize bg-board/95 p-6 shadow-2xl ${isOverlay ? "h-full min-h-0 overflow-hidden" : "bg-prize/15"}`}>
        <div className="mb-2 shrink-0 text-sm font-bold uppercase tracking-widest text-prize">Правильный ответ</div>
        {answerText ? <div className="shrink-0 text-4xl font-black">{answerText}</div> : null}
        {answerMedia === "image" && question.answerImageUrl ? (
          <button
            className={`block border-0 bg-transparent p-0 ${isOverlay ? "mt-4 min-h-0 w-full flex-1 overflow-hidden rounded-lg" : "mt-4 w-full"}`}
            type="button"
            aria-label="Открыть изображение ответа во весь экран"
            onClick={() => setExpandedImage(question.answerImageUrl ?? null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={question.answerImageUrl} alt="" className={`w-full cursor-zoom-in rounded-lg object-contain ${isOverlay ? "h-full max-h-full" : "max-h-[42vh]"}`} />
          </button>
        ) : null}
        {answerMedia === "audio" && question.answerAudioUrl ? (
          <audio className="mt-4 w-full shrink-0" src={question.answerAudioUrl} controls />
        ) : null}
        {answerMedia === "video" && question.answerVideoUrl ? (
          answerVideoUrl?.includes("youtube.com/embed/") ? (
            <iframe
              className={`mt-4 min-h-0 w-full rounded-lg ${isOverlay ? "flex-1" : "aspect-video"}`}
              src={answerVideoUrl}
              title="Видео ответа"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video className={`mt-4 min-h-0 w-full rounded-lg object-contain ${isOverlay ? "flex-1" : "max-h-[42vh]"}`} src={question.answerVideoUrl} controls />
          )
        ) : null}
      </div>
    );
  }

  return (
    <main className={`h-screen overflow-hidden bg-board text-ink ${focusMode ? "p-8" : "py-8 pl-8 pr-4"}`}>
      <div className="flex h-[calc(100vh-4rem)] min-h-0 gap-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <header className="flex items-start gap-5">
              {!focusMode ? (
                <button className="btn btn-secondary" type="button" onClick={() => router.push("/game")}>
                  <ArrowLeft size={20} /> Назад
                </button>
              ) : null}
              <div>
                <h4 className="text-base font-bold uppercase tracking-widest text-white/60">{theme.title}</h4>
                <h3 className="text-4xl font-black text-prize">{question.price}</h3>
              </div>
            </header>
          </div>
          {question.text ? <h1 className="shrink-0 text-6xl font-black leading-tight">{question.text}</h1> : null}
          {hasQuestionMedia ? (
            <div className="relative min-h-0 flex-1">
              {question.imageUrl ? (
                <button
                  className="block h-full max-h-full w-full overflow-hidden rounded-lg border-0 bg-transparent p-0"
                  type="button"
                  aria-label="Открыть изображение вопроса во весь экран"
                  onClick={() => setExpandedImage(question.imageUrl ?? null)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={question.imageUrl} alt="" className="h-full max-h-full w-full cursor-zoom-in object-contain" />
                </button>
              ) : null}
              {question.audioUrl ? <audio className="w-full" src={question.audioUrl} controls /> : null}
              {question.videoUrl ? (
                embedUrl(question.videoUrl)?.includes("youtube.com/embed/") ? (
                  <iframe
                    className="h-full max-h-full w-full rounded-lg"
                    src={embedUrl(question.videoUrl)}
                    title="Видео вопроса"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video className="h-full max-h-full w-full rounded-lg object-contain" src={question.videoUrl} controls />
                )
              ) : null}
              {answerVisible ? <div className="absolute inset-0 z-10 rounded-lg">{renderAnswerBlock(true)}</div> : null}
            </div>
          ) : null}
          {question.answerFormat === "multiple-choice" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {(question.answerOptions ?? []).map((option) => (
                <div
                  className={`rounded-lg border p-5 text-2xl font-bold ${
                    answerVisible && option.isCorrect ? "border-prize bg-prize text-board" : "border-white/15 bg-white/8"
                  }`}
                  key={option.id}
                >
                  {option.text}
                </div>
              ))}
            </div>
          ) : null}
          {answerVisible && !hasQuestionMedia ? renderAnswerBlock() : null}
        </div>
        {!focusMode || hostOpen ? (
          <HostPanel
            open={hostOpen}
            setOpen={setHostOpen}
            resultsOpen={resultsOpen}
            setResultsOpen={setResultsOpen}
            answerVisible={answerVisible}
            setAnswerVisible={setAnswerVisible}
            question={question}
            state={state}
            setState={setState}
            onNext={returnToBoard}
          />
        ) : null}
      </div>
      <TimerLoader rightOffset={hostOpen ? 272 : 24} />
      {focusMode ? <ScoreResultsDialog open={resultsOpen} setOpen={setResultsOpen} state={state} /> : null}
      {expandedImage ? (
        <button className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-black/95 p-6" type="button" aria-label="Закрыть изображение" onClick={() => setExpandedImage(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={expandedImage} alt="" className="max-h-full max-w-full object-contain" />
        </button>
      ) : null}
    </main>
  );
}
