"use client";

type ElectronMediaApi = {
  saveFile: (file: { name: string; type: string; bytes: ArrayBuffer }) => Promise<{ url?: string }>;
};

declare global {
  interface Window {
    svoyaIgraMedia?: ElectronMediaApi;
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function savePersistentFile(file: File) {
  const mediaApi = typeof window === "undefined" ? undefined : window.svoyaIgraMedia;
  if (mediaApi) {
    try {
      const result = await mediaApi.saveFile({
        name: file.name,
        type: file.type,
        bytes: await file.arrayBuffer()
      });
      if (result.url) return result.url;
    } catch {
      // Fall back to an inline value when Electron storage is unavailable.
    }
  }

  return fileToDataUrl(file);
}
