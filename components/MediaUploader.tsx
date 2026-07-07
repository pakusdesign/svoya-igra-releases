"use client";

import { Field } from "@fluentui/react-components";
import { useEffect, useMemo, useRef, useState } from "react";
import { detectFileMediaType, detectUrlMediaType, type FileDetails, type MediaType, type SourceType } from "@/lib/media";
import { savePersistentFile } from "@/lib/persistentFile";
import type { Question } from "@/lib/types";
import { AdminSelect } from "./AdminSelect";
import { MediaFileControl } from "./MediaFileControl";
import { MediaReplaceConfirmDialog } from "./MediaReplaceConfirmDialog";

type MediaField = "imageUrl" | "audioUrl" | "videoUrl" | "answerImageUrl" | "answerAudioUrl" | "answerVideoUrl";
type VideoTypeField = "videoType" | "answerVideoType";

type MediaFields = {
  image: MediaField;
  audio: MediaField;
  video: MediaField;
  videoType: VideoTypeField;
};

type MediaUploaderProps = {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
  title?: string;
  fields?: MediaFields;
  allowedTypes?: MediaType[];
  lockedMediaType?: MediaType;
  showMediaTypePicker?: boolean;
  compactFileInput?: boolean;
  autoDetectMediaType?: boolean;
  getPatchForMediaType?: (mediaType: MediaType) => Partial<Question>;
};

type MediaCacheEntry = {
  url?: string;
  file?: string;
  fileDetails?: FileDetails | null;
};

type MediaCache = Record<MediaType, MediaCacheEntry>;

const defaultFields: MediaFields = {
  image: "imageUrl",
  audio: "audioUrl",
  video: "videoUrl",
  videoType: "videoType"
};

export const answerMediaFields: MediaFields = {
  image: "answerImageUrl",
  audio: "answerAudioUrl",
  video: "answerVideoUrl",
  videoType: "answerVideoType"
};

const defaultMediaOptions: Array<{ type: MediaType; label: string; accept: string; field: MediaField }> = [
  { type: "image", label: "Изображение", accept: "image/*", field: "imageUrl" },
  { type: "audio", label: "Звук", accept: "audio/*", field: "audioUrl" },
  { type: "video", label: "Видео", accept: "video/*", field: "videoUrl" }
];

const sourceOptions: Array<{ type: SourceType; label: string }> = [
  { type: "file", label: "Файл" },
  { type: "url", label: "Ссылка" }
];

function getMediaOptions(fields: MediaFields) {
  return defaultMediaOptions.map((option) => ({ ...option, field: fields[option.type] }));
}

function getInitialMediaType(question: Question, fields: MediaFields): MediaType {
  if (question[fields.audio]) return "audio";
  if (question[fields.video]) return "video";
  return "image";
}

function getSourceType(value?: string, videoType?: Question["videoType"] | Question["answerVideoType"]): SourceType {
  if (!value) return "file";
  if (videoType === "file" || value.startsWith("blob:") || value.startsWith("data:") || value.startsWith("/__media__/")) return "file";
  return "url";
}

function getInitialCache(question: Question, fields: MediaFields): MediaCache {
  return {
    image: { [getSourceType(question[fields.image])]: question[fields.image] },
    audio: { [getSourceType(question[fields.audio])]: question[fields.audio] },
    video: { [getSourceType(question[fields.video], question[fields.videoType])]: question[fields.video] }
  };
}

export function MediaUploader({
  question,
  onChange,
  title = "Медиа вопроса",
  fields = defaultFields,
  allowedTypes,
  lockedMediaType,
  showMediaTypePicker = true,
  compactFileInput = false,
  autoDetectMediaType = false,
  getPatchForMediaType
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaOptions = useMemo(() => getMediaOptions(fields).filter((option) => !allowedTypes || allowedTypes.includes(option.type)), [fields, allowedTypes]);
  const [mediaType, setMediaType] = useState<MediaType>(() => lockedMediaType ?? getInitialMediaType(question, fields));
  const activeOption = useMemo(() => mediaOptions.find((option) => option.type === mediaType) ?? mediaOptions[0], [mediaType, mediaOptions]);
  const value = question[activeOption.field];
  const [sourceType, setSourceType] = useState<SourceType>(() => getSourceType(value, question[fields.videoType]));
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [mediaCache, setMediaCache] = useState<MediaCache>(() => getInitialCache(question, fields));
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (!lockedMediaType || lockedMediaType === mediaType) return;
    const nextOption = mediaOptions.find((option) => option.type === lockedMediaType);
    if (!nextOption) return;
    const cachedEntry = mediaCache[lockedMediaType];
    const nextValue = question[nextOption.field];
    const nextSourceType = getSourceType(nextValue, lockedMediaType === "video" ? question[fields.videoType] : undefined);
    const restoredValue = cachedEntry[nextSourceType] ?? nextValue;
    setMediaType(lockedMediaType);
    setSourceType(nextSourceType);
    setFileDetails(nextSourceType === "file" ? cachedEntry.fileDetails ?? null : null);
    onChange({
      ...getPatchForMediaType?.(lockedMediaType),
      ...clearOtherMedia(lockedMediaType),
      [nextOption.field]: restoredValue,
      [fields.videoType]: lockedMediaType === "video" && restoredValue ? nextSourceType : undefined
    });
  }, [lockedMediaType]);

  function clearOtherMedia(nextType: MediaType): Partial<Question> {
    return {
      [fields.image]: nextType === "image" ? question[fields.image] : undefined,
      [fields.audio]: nextType === "audio" ? question[fields.audio] : undefined,
      [fields.video]: nextType === "video" ? question[fields.video] : undefined,
      [fields.videoType]: nextType === "video" ? question[fields.videoType] : undefined
    };
  }

  function setMediaValueForType(nextMediaType: MediaType, nextValue?: string, nextSourceType = sourceType, nextFileDetails = fileDetails) {
    const nextOption = mediaOptions.find((option) => option.type === nextMediaType) ?? mediaOptions[0];
    setMediaType(nextMediaType);
    setMediaCache((current) => ({
      ...current,
      [nextMediaType]: {
        ...current[nextMediaType],
        [nextSourceType]: nextValue,
        fileDetails: nextSourceType === "file" ? nextFileDetails : current[nextMediaType].fileDetails
      }
    }));
    onChange({
      ...getPatchForMediaType?.(nextMediaType),
      ...clearOtherMedia(nextMediaType),
      [nextOption.field]: nextValue,
      [fields.videoType]: nextMediaType === "video" && nextValue ? nextSourceType : undefined
    });
  }

  function hasUploadedFile() {
    return Boolean(mediaCache.image.file || mediaCache.audio.file || mediaCache.video.file);
  }

  function chooseMediaType(nextType: MediaType) {
    setMediaType(nextType);
    const nextOption = mediaOptions.find((option) => option.type === nextType) ?? mediaOptions[0];
    const nextValue = question[nextOption.field];
    const cachedEntry = mediaCache[nextType];
    const nextSourceType = getSourceType(nextValue, nextType === "video" ? question[fields.videoType] : undefined);
    const restoredValue = cachedEntry[nextSourceType] ?? nextValue;
    setSourceType(nextSourceType);
    setFileDetails(nextSourceType === "file" ? cachedEntry.fileDetails ?? null : null);
    onChange({
      ...clearOtherMedia(nextType),
      [nextOption.field]: restoredValue,
      [fields.videoType]: nextType === "video" && restoredValue ? nextSourceType : undefined
    });
  }

  function chooseSourceType(nextSourceType: SourceType) {
    setSourceType(nextSourceType);
    const restoredValue = mediaCache[mediaType][nextSourceType];
    setFileDetails(nextSourceType === "file" ? mediaCache[mediaType].fileDetails ?? null : null);
    onChange({
      ...clearOtherMedia(mediaType),
      [activeOption.field]: restoredValue,
      [fields.videoType]: mediaType === "video" && restoredValue ? nextSourceType : undefined
    });
  }

  function changeUrl(nextValue: string) {
    const detectedMediaType = autoDetectMediaType ? detectUrlMediaType(nextValue) : undefined;
    setMediaValueForType(detectedMediaType ?? mediaType, nextValue || undefined, "url", null);
  }

  function useFile(file?: File) {
    if (!file) return;
    const detectedMediaType = detectFileMediaType(file);
    if (!detectedMediaType) return;
    if (!autoDetectMediaType) {
      const expectedType = activeOption.accept.replace("/*", "/");
      if (!file.type.startsWith(expectedType)) return;
    }
    if (hasUploadedFile()) {
      setPendingFile(file);
      return;
    }
    void applyFile(file, autoDetectMediaType ? detectedMediaType : mediaType);
  }

  async function applyFile(file: File, nextMediaType = mediaType) {
    const nextDetails = { name: file.name, size: file.size };
    const nextValue = await savePersistentFile(file);
    const nextOption = mediaOptions.find((option) => option.type === nextMediaType) ?? mediaOptions[0];
    setSourceType("file");
    setMediaType(nextMediaType);
    setFileDetails(nextDetails);
    setMediaCache((current) => ({
      ...current,
      [nextMediaType]: {
        ...current[nextMediaType],
        file: nextValue,
        fileDetails: nextDetails
      }
    }));
    onChange({
      ...getPatchForMediaType?.(nextMediaType),
      [fields.image]: undefined,
      [fields.audio]: undefined,
      [fields.video]: undefined,
      [nextOption.field]: nextValue,
      [fields.videoType]: nextMediaType === "video" ? "file" : undefined
    });
  }

  function confirmPendingFile() {
    if (!pendingFile) return;
    void applyFile(pendingFile, autoDetectMediaType ? detectFileMediaType(pendingFile) ?? mediaType : mediaType);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function cancelPendingFile() {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearMedia() {
    setFileDetails(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMediaCache((current) => ({
      ...current,
      [mediaType]: {
        ...current[mediaType],
        [sourceType]: undefined,
        fileDetails: sourceType === "file" ? null : current[mediaType].fileDetails
      }
    }));
    onChange({
      ...clearOtherMedia(mediaType),
      [activeOption.field]: undefined,
      [fields.videoType]: undefined
    });
  }

  const acceptLabel = autoDetectMediaType ? "image/*, audio/*, video/*" : activeOption.accept;
  const accept = autoDetectMediaType ? "image/*,audio/*,video/*" : activeOption.accept;

  return (
    <div className="space-y-3">
      {pendingFile ? <MediaReplaceConfirmDialog onConfirm={confirmPendingFile} onCancel={cancelPendingFile} /> : null}

      <div className={`grid items-start gap-3 ${showMediaTypePicker && !autoDetectMediaType ? "lg:grid-cols-[220px_160px_1fr]" : "lg:grid-cols-[160px_1fr]"}`}>
        {showMediaTypePicker && !autoDetectMediaType ? (
          <Field className="self-start" label={title}>
            <AdminSelect
              ariaLabel={title}
              options={mediaOptions.map((option) => ({ value: option.type, label: option.label }))}
              value={mediaType}
              onChange={chooseMediaType}
            />
          </Field>
        ) : null}
        <Field className="self-start" label="Источник">
          <AdminSelect
            ariaLabel="Источник"
            options={sourceOptions.map((option) => ({ value: option.type, label: option.label }))}
            value={sourceType}
            onChange={chooseSourceType}
          />
        </Field>
        <div>
          <span className="admin-muted mb-1 block text-sm font-semibold">{sourceType === "url" ? "URL" : "Файл"}</span>
          {sourceType === "url" ? (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className="field"
                placeholder="Ссылка на изображение, аудио или видео"
                value={value ?? ""}
                onChange={(event) => changeUrl(event.target.value)}
              />
              <button className="btn btn-secondary" type="button" onClick={clearMedia} disabled={!value}>
                Удалить медиа
              </button>
            </div>
          ) : (
            <MediaFileControl
              fileInputRef={fileInputRef}
              value={value}
              mediaType={mediaType}
              fileDetails={fileDetails}
              accept={accept}
              acceptLabel={acceptLabel}
              compact={compactFileInput}
              onUseFile={useFile}
              onClear={clearMedia}
            />
          )}
        </div>
      </div>
    </div>
  );
}
