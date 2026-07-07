export type MediaType = "image" | "audio" | "video";
export type SourceType = "url" | "file";

export type FileDetails = {
  name: string;
  size: number;
};

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

export function detectFileMediaType(file: File): MediaType | undefined {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return undefined;
}

export function detectUrlMediaType(url: string): MediaType | undefined {
  const normalized = url.split("?")[0].toLowerCase();
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(url)) return "video";
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(normalized)) return "image";
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(normalized)) return "audio";
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(normalized)) return "video";
  return undefined;
}
