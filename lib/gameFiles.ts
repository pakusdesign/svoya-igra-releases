"use client";

import type { GameState } from "./types";

type GameFileResult = {
  ok: boolean;
  canceled?: boolean;
  message?: string;
  path?: string;
  fileName?: string;
  mediaCount?: number;
  game?: GameState;
};

type ElectronGameFilesApi = {
  exportGame: (game: GameState) => Promise<GameFileResult>;
  importGame: () => Promise<GameFileResult>;
  revealFile: (filePath: string) => Promise<{ ok: boolean }>;
};

declare global {
  interface Window {
    svoyaIgraGameFiles?: ElectronGameFilesApi;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{
      name: string;
      createWritable: () => Promise<{
        write: (data: string) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }>;
  }
}

type PortableGamePackage = {
  format: "svoya-igra-game";
  version: 1;
  exportedAt: string;
  game: GameState;
  media: [];
};

function safeFileName(value: string) {
  return (
    value
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .slice(0, 80) || "svoya-igra"
  );
}

function downloadBlob(fileName: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function saveWithBrowserPicker(fileName: string, content: string) {
  if (!window.showSaveFilePicker) return null;

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: "Файл игры Svoya Igra",
          accept: { "application/json": [".svoyaigra"] }
        }
      ]
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return handle.name;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "";
    throw error;
  }
}

function readFileText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function chooseFile() {
  return new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svoyaigra,application/json,.json";
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

function parseGameFile(raw: string): GameState {
  const parsed = JSON.parse(raw);
  if (parsed && parsed.format === "svoya-igra-game" && parsed.game) {
    return parsed.game as GameState;
  }
  return parsed as GameState;
}

export function isGameState(value: unknown): value is GameState {
  const game = value as GameState | undefined;
  return Boolean(
    game &&
      typeof game === "object" &&
      typeof game.id === "string" &&
      typeof game.title === "string" &&
      Array.isArray(game.savedPlayers) &&
      Array.isArray(game.players) &&
      Array.isArray(game.rounds) &&
      Array.isArray(game.scoreEvents)
  );
}

export async function exportGameFile(game: GameState): Promise<GameFileResult> {
  const electronApi = typeof window === "undefined" ? undefined : window.svoyaIgraGameFiles;
  if (electronApi) return electronApi.exportGame(game);

  const fileName = `${safeFileName(game.title)}.svoyaigra`;
  const gamePackage: PortableGamePackage = {
    format: "svoya-igra-game",
    version: 1,
    exportedAt: new Date().toISOString(),
    game,
    media: []
  };
  const content = JSON.stringify(gamePackage);
  const pickedFileName = await saveWithBrowserPicker(fileName, content);
  if (pickedFileName === "") return { ok: false, canceled: true };
  if (pickedFileName) return { ok: true, mediaCount: 0, fileName: pickedFileName };

  downloadBlob(fileName, content);
  return { ok: true, mediaCount: 0, fileName };
}

export async function revealGameFile(filePath: string) {
  const electronApi = typeof window === "undefined" ? undefined : window.svoyaIgraGameFiles;
  if (!electronApi) return { ok: false };
  return electronApi.revealFile(filePath);
}

export async function importGameFile(): Promise<GameFileResult> {
  const electronApi = typeof window === "undefined" ? undefined : window.svoyaIgraGameFiles;
  if (electronApi) return electronApi.importGame();

  const file = await chooseFile();
  if (!file) return { ok: false, canceled: true };
  return { ok: true, game: parseGameFile(await readFileText(file)) };
}
