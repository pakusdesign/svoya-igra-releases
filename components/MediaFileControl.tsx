"use client";

import { FileUp, Upload } from "lucide-react";
import { useState, type RefObject } from "react";
import { formatFileSize, type FileDetails, type MediaType } from "@/lib/media";

type Props = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  value?: string;
  mediaType: MediaType;
  fileDetails: FileDetails | null;
  accept: string;
  acceptLabel: string;
  compact?: boolean;
  onUseFile: (file?: File) => void;
  onClear: () => void;
};

function MediaPreview({ mediaType, value }: { mediaType: MediaType; value: string }) {
  if (mediaType === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={value} alt="" className="max-h-56 w-full rounded-lg object-contain" />
    );
  }
  if (mediaType === "audio") {
    return <audio className="w-full" src={value} controls />;
  }
  return <video className="max-h-64 w-full rounded-lg" src={value} controls />;
}

export function MediaFileControl({ fileInputRef, value, mediaType, fileDetails, accept, acceptLabel, compact = false, onUseFile, onClear }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`rounded-lg border border-dashed p-4 transition ${
        isDragging ? "border-[var(--colorBrandStroke1)] bg-[var(--colorBrandBackground2)]" : "border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground2)]"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        onUseFile(event.dataTransfer.files?.[0]);
      }}
    >
      {value ? (
        <div className="space-y-4">
          <MediaPreview mediaType={mediaType} value={value} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--colorNeutralBackground3)] p-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileUp className="shrink-0 text-[var(--colorBrandForeground1)]" size={22} />
              <div className="min-w-0">
                <div className="truncate font-bold">{fileDetails?.name ?? "Выбранный файл"}</div>
                <div className="admin-muted text-sm">{fileDetails ? formatFileSize(fileDetails.size) : acceptLabel}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" type="button" onClick={() => fileInputRef.current?.click()}>
                Изменить файл
              </button>
              <button className="btn btn-secondary" type="button" onClick={onClear}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button className={`flex w-full flex-col items-center justify-center gap-3 text-center ${compact ? "min-h-16" : "min-h-32"}`} type="button" onClick={() => fileInputRef.current?.click()}>
          <Upload size={24} />
          <span className="font-semibold">Перетащите файл сюда или выберите на диске</span>
          <span className="admin-muted text-sm">{acceptLabel}</span>
        </button>
      )}
      <input ref={fileInputRef} className="hidden" type="file" accept={accept} onChange={(event) => onUseFile(event.target.files?.[0])} />
    </div>
  );
}
