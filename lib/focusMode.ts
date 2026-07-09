const GAME_FOCUS_MODE_STORAGE_KEY = "svoya-igra-focus-mode";

export function isGameFocusModeStored() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(GAME_FOCUS_MODE_STORAGE_KEY) === "true";
}

export function storeGameFocusMode(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.sessionStorage.setItem(GAME_FOCUS_MODE_STORAGE_KEY, "true");
  } else {
    window.sessionStorage.removeItem(GAME_FOCUS_MODE_STORAGE_KEY);
  }
}
