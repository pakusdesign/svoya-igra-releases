import type { Question } from "./types";

export type AnswerType = NonNullable<Question["answerType"]>;
export type AnswerMode = "text" | "media" | "mixed";
export type AnswerMediaType = "image" | "audio" | "video";

export const answerModeOptions: Array<{ value: AnswerMode; label: string }> = [
  { value: "text", label: "Только текст" },
  { value: "media", label: "Только медиа" },
  { value: "mixed", label: "Текст + медиа" }
];

const mediaFieldByType: Record<AnswerMediaType, "answerImageUrl" | "answerAudioUrl" | "answerVideoUrl"> = {
  image: "answerImageUrl",
  audio: "answerAudioUrl",
  video: "answerVideoUrl"
};

const mediaLabelByType: Record<AnswerMediaType, string> = {
  image: "изображение",
  audio: "аудио",
  video: "видео"
};

export function getAnswerType(question: Question): AnswerType {
  return question.answerType ?? "text";
}

export function answerMediaType(answerType: AnswerType): AnswerMediaType | undefined {
  if (answerType === "image" || answerType === "text-image") return "image";
  if (answerType === "audio" || answerType === "text-audio") return "audio";
  if (answerType === "video" || answerType === "text-video") return "video";
  return undefined;
}

export function answerMode(answerType: AnswerType): AnswerMode {
  if (answerType === "text") return "text";
  if (answerType === "text-image" || answerType === "text-audio" || answerType === "text-video") return "mixed";
  return "media";
}

export function answerTypeFromMode(mode: AnswerMode, mediaType: AnswerMediaType): AnswerType {
  if (mode === "text") return "text";
  if (mode === "media") return mediaType;
  if (mediaType === "image") return "text-image";
  return mediaType === "video" ? "text-video" : "text-audio";
}

export function answerIncludesText(answerType: AnswerType): boolean {
  return answerMode(answerType) !== "media";
}

export function answerTypePatch(question: Question, answerType: AnswerType): Partial<Question> {
  const mediaType = answerMediaType(answerType);
  return {
    answerType,
    answerText: answerIncludesText(answerType) ? question.answerText : "",
    answerImageUrl: mediaType === "image" ? question.answerImageUrl : undefined,
    answerAudioUrl: mediaType === "audio" ? question.answerAudioUrl : undefined,
    answerVideoUrl: mediaType === "video" ? question.answerVideoUrl : undefined,
    answerVideoType: mediaType === "video" ? question.answerVideoType : undefined
  };
}

export function answerValidationIssue(question: Question, questionPath: string): string | null {
  const answerType = getAnswerType(question);
  const mode = answerMode(answerType);
  const mediaType = answerMediaType(answerType);
  const hasAnswerText = Boolean(question.answerText?.trim());
  const hasAnswerMedia = mediaType ? Boolean(question[mediaFieldByType[mediaType]]) : false;

  if (mode === "text" && !hasAnswerText) {
    return `${questionPath}: заполните текст правильного ответа.`;
  }
  if (mode === "media" && mediaType && !hasAnswerMedia) {
    return `${questionPath}: добавьте ${mediaLabelByType[mediaType]} правильного ответа.`;
  }
  if (mode === "mixed" && mediaType && (!hasAnswerText || !hasAnswerMedia)) {
    return `${questionPath}: заполните текст и добавьте ${mediaLabelByType[mediaType]} правильного ответа.`;
  }
  return null;
}
