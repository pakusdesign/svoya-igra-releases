"use client";

import { Button, Field, Input, Radio, RadioGroup } from "@fluentui/react-components";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { DEFAULT_PRICES, id } from "@/lib/game";
import type { Question, Theme } from "@/lib/types";
import { AdminSelect } from "./AdminSelect";
import { AnswerOptionsEditor } from "./AnswerOptionsEditor";
import { answerMediaFields, MediaUploader } from "./MediaUploader";
import { useState, type DragEvent } from "react";

type Props = {
  theme: Theme;
  onChange: (theme: Theme) => void;
};

type AnswerType = NonNullable<Question["answerType"]>;
type AnswerMode = "text" | "media" | "mixed";
type AnswerMediaType = "image" | "audio" | "video";
type QuestionDropTarget = {
  questionId: string;
  position: "before" | "after";
};

const answerModeOptions: Array<{ value: AnswerMode; label: string }> = [
  { value: "text", label: "Только текст" },
  { value: "media", label: "Только медиа" },
  { value: "mixed", label: "Текст + медиа" }
];

function answerMediaType(answerType: AnswerType): "image" | "audio" | "video" | undefined {
  if (answerType === "image" || answerType === "text-image") return "image";
  if (answerType === "audio" || answerType === "text-audio") return "audio";
  if (answerType === "video" || answerType === "text-video") return "video";
  return undefined;
}

function answerMode(answerType: AnswerType): AnswerMode {
  if (answerType === "text") return "text";
  if (answerType === "text-image" || answerType === "text-audio" || answerType === "text-video") return "mixed";
  return "media";
}

function answerTypeFromMode(mode: AnswerMode, mediaType: AnswerMediaType): AnswerType {
  if (mode === "text") return "text";
  if (mode === "media") return mediaType;
  if (mediaType === "image") return "text-image";
  return mediaType === "video" ? "text-video" : "text-audio";
}

function answerTypePatch(question: Question, answerType: AnswerType): Partial<Question> {
  return {
    answerType,
    answerText: answerType === "text" || answerType === "text-image" || answerType === "text-audio" || answerType === "text-video" ? question.answerText : "",
    answerImageUrl: answerType === "image" || answerType === "text-image" ? question.answerImageUrl : undefined,
    answerAudioUrl: answerType === "audio" || answerType === "text-audio" ? question.answerAudioUrl : undefined,
    answerVideoUrl: answerType === "video" || answerType === "text-video" ? question.answerVideoUrl : undefined,
    answerVideoType: answerType === "video" || answerType === "text-video" ? question.answerVideoType : undefined
  };
}

function priceForIndex(index: number) {
  return DEFAULT_PRICES[index] ?? (index + 1) * 100;
}

function sortQuestionsByPrice(questions: Question[]) {
  return [...questions].sort((a, b) => a.price - b.price);
}

function normalizeQuestionPrices(questions: Question[]) {
  return questions.map((question, index) => ({ ...question, price: priceForIndex(index) }));
}

export function AdminQuestionsEditor({ theme, onChange }: Props) {
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<QuestionDropTarget | null>(null);
  const [collapsedQuestionIds, setCollapsedQuestionIds] = useState<string[]>([]);
  const orderedQuestions = sortQuestionsByPrice(theme.questions);

  function updateQuestion(questionId: string, patch: Partial<Question>) {
    onChange({
      ...theme,
      questions: theme.questions.map((question) => (question.id === questionId ? { ...question, ...patch } : question))
    });
  }

  function questionDropPosition(event: DragEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
  }

  function moveQuestion(target: QuestionDropTarget) {
    if (!draggedQuestionId || target.questionId === draggedQuestionId) return;

    const currentQuestions = sortQuestionsByPrice(theme.questions);
    const draggedQuestion = currentQuestions.find((question) => question.id === draggedQuestionId);
    if (!draggedQuestion) return;

    const withoutDragged = currentQuestions.filter((question) => question.id !== draggedQuestionId);
    const targetIndex = withoutDragged.findIndex((question) => question.id === target.questionId);
    if (targetIndex < 0) return;

    const insertIndex = target.position === "before" ? targetIndex : targetIndex + 1;
    const nextQuestions = [...withoutDragged];
    nextQuestions.splice(insertIndex, 0, draggedQuestion);

    onChange({ ...theme, questions: normalizeQuestionPrices(nextQuestions) });
    setDraggedQuestionId(null);
    setDropTarget(null);
  }

  function deleteQuestion(questionId: string) {
    onChange({
      ...theme,
      questions: normalizeQuestionPrices(sortQuestionsByPrice(theme.questions).filter((item) => item.id !== questionId))
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="admin-group-label">Вопросы</h4>
        <Button
          appearance="secondary"
          disabled={orderedQuestions.length >= DEFAULT_PRICES.length}
          icon={<Plus size={18} />}
          type="button"
          onClick={() => {
            const price = priceForIndex(orderedQuestions.length);
            onChange({
              ...theme,
              questions: [
                ...orderedQuestions,
                {
                  id: id("question"),
                  price,
                  text: "",
                  answerText: "",
                  answerFormat: "open",
                  answerOptions: [],
                  isPlayed: false
                }
              ]
            });
          }}
        >
          Добавить вопрос
        </Button>
      </div>
      {orderedQuestions
        .map((question) => {
          const isDragging = draggedQuestionId === question.id;
          const isDropBefore = dropTarget?.questionId === question.id && dropTarget.position === "before";
          const isDropAfter = dropTarget?.questionId === question.id && dropTarget.position === "after";
          const collapsed = collapsedQuestionIds.includes(question.id);
          return (
            <div
              className={`space-y-4 rounded-lg border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] p-4 transition ${
                isDragging ? "opacity-45" : ""
              } ${isDropBefore ? "border-t-4 border-t-[var(--colorBrandBackground)]" : ""} ${
                isDropAfter ? "border-b-4 border-b-[var(--colorBrandBackground)]" : ""
              }`}
              key={question.id}
              onDragOver={(event) => {
                if (!draggedQuestionId || draggedQuestionId === question.id) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropTarget({ questionId: question.id, position: questionDropPosition(event) });
              }}
              onDrop={(event) => {
                if (!draggedQuestionId || draggedQuestionId === question.id) return;
                event.preventDefault();
                moveQuestion({ questionId: question.id, position: questionDropPosition(event) });
              }}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    className="grid min-h-10 min-w-10 shrink-0 cursor-grab place-items-center rounded border border-transparent bg-transparent text-[var(--colorNeutralForeground3)] transition hover:bg-[var(--colorNeutralBackground3)] hover:text-[var(--colorNeutralForeground1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--colorBrandStroke1)] active:cursor-grabbing"
                    type="button"
                    aria-label={`Перетащить вопрос стоимостью ${question.price}`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", question.id);
                      setDraggedQuestionId(question.id);
                    }}
                    onDragEnd={() => {
                      setDraggedQuestionId(null);
                      setDropTarget(null);
                    }}
                  >
                    <GripVertical size={18} />
                  </button>
                  <button
                    className="flex min-w-0 items-center gap-2 text-left"
                    type="button"
                    aria-expanded={!collapsed}
                    onClick={() =>
                      setCollapsedQuestionIds((current) =>
                        current.includes(question.id) ? current.filter((id) => id !== question.id) : [...current, question.id]
                      )
                    }
                  >
                    <ChevronDown className={`admin-accent shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`} size={22} />
                    <span className="admin-subtitle admin-accent tabular-nums">{question.price}</span>
                  </button>
                </div>
                <Button
                  appearance="secondary"
                  icon={<Trash2 size={18} />}
                  type="button"
                  onClick={() => deleteQuestion(question.id)}
                >
                  Удалить
                </Button>
              </div>
              {!collapsed ? (
                <>
                  <Field label="Текст вопроса">
                    <Input
                      value={question.text ?? ""}
                      onChange={(event) => updateQuestion(question.id, { text: event.target.value })}
                    />
                  </Field>
                  <MediaUploader question={question} onChange={(patch) => updateQuestion(question.id, patch)} autoDetectMediaType />
                  <div className="h-px bg-[var(--colorNeutralStroke2)]" />
                  <div className="space-y-3">
                    <Field label="Формат ответа">
                      <RadioGroup
                        layout="horizontal"
                        value={question.answerFormat}
                        onChange={(_, data) =>
                          updateQuestion(
                            question.id,
                            data.value === "multiple-choice"
                              ? { answerFormat: "multiple-choice", answerOptions: question.answerOptions ?? [] }
                              : { answerFormat: "open", answerOptions: [] }
                          )
                        }
                      >
                        <Radio value="open" label="Открытый ответ" />
                        <Radio value="multiple-choice" label="Несколько вариантов" />
                      </RadioGroup>
                    </Field>
                    {question.answerFormat === "multiple-choice" ? (
                      <AnswerOptionsEditor
                        options={question.answerOptions ?? []}
                        onChange={(options) => updateQuestion(question.id, { answerOptions: options })}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-[220px]">
                          <Field label="Тип правильного ответа">
                            <AdminSelect
                              ariaLabel="Тип правильного ответа"
                              options={answerModeOptions}
                              value={answerMode(question.answerType ?? "text")}
                              onChange={(nextMode) => {
                                const currentMediaType = answerMediaType(question.answerType ?? "text") ?? "image";
                                updateQuestion(question.id, answerTypePatch(question, answerTypeFromMode(nextMode, currentMediaType)));
                              }}
                            />
                          </Field>
                        </div>
                        {question.answerType === undefined || question.answerType === "text" || question.answerType === "text-image" || question.answerType === "text-audio" || question.answerType === "text-video" ? (
                          <Field label="Текст правильного ответа">
                            <Input
                              value={question.answerText}
                              onChange={(event) => updateQuestion(question.id, { answerText: event.target.value })}
                            />
                          </Field>
                        ) : null}
                        {answerMediaType(question.answerType ?? "text") ? (
                          <MediaUploader
                            question={question}
                            onChange={(patch) => updateQuestion(question.id, patch)}
                            title="Медиа правильного ответа"
                            fields={answerMediaFields}
                            showMediaTypePicker={false}
                            compactFileInput
                            autoDetectMediaType
                            getPatchForMediaType={(mediaType) => ({ answerType: answerTypeFromMode(answerMode(question.answerType ?? "text"), mediaType as AnswerMediaType) })}
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      {!theme.questions.length ? <p className="admin-muted">В этой теме пока нет вопросов.</p> : null}
    </div>
  );
}
