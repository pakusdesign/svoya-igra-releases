const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const crypto = require("node:crypto");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const http = require("node:http");
const next = require("next");
const path = require("node:path");
const { autoUpdater } = require("electron-updater");

let server;
let mainWindow;
let updateStatus = {
  status: "idle",
  message: "Обновления ещё не проверялись.",
  currentVersion: app.getVersion()
};

const appId = "ru.svoyaigra.desktop";
const isDev = !app.isPackaged;
const packagedPort = 37421;
const mediaRoutePrefix = "/__media__/";
const gamePackageVersion = 1;
const defaultPublishConfig = {
  provider: "github",
  owner: "pakusdesign",
  repo: "svoya-igra-releases",
  releaseType: "release"
};
const releasesUrl = `https://github.com/${defaultPublishConfig.owner}/${defaultPublishConfig.repo}/releases/latest`;

app.setAppUserModelId(appId);
autoUpdater.autoDownload = false;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });
}

function getAppDir() {
  return isDev ? path.join(__dirname, "..") : app.getAppPath();
}

function getWindowIcon() {
  return path.join(getAppDir(), "build", "icon.png");
}

function getMediaDir() {
  return path.join(app.getPath("userData"), "media");
}

function mediaExtension(name, type) {
  const ext = path.extname(name).toLowerCase();
  if (/^\.[a-z0-9]{1,8}$/.test(ext)) return ext;
  const mimeExtensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov"
  };
  return mimeExtensions[type] || "";
}

function mediaContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".m4v": "video/mp4"
  };
  return types[ext] || "application/octet-stream";
}

function collectMediaUrls(value, urls = new Set()) {
  if (!value || typeof value !== "object") return urls;
  if (Array.isArray(value)) {
    for (const item of value) {
      collectMediaUrls(item, urls);
    }
    return urls;
  }
  for (const item of Object.values(value)) {
    if (typeof item === "string" && item.startsWith(mediaRoutePrefix)) {
      urls.add(item);
    } else if (item && typeof item === "object") {
      collectMediaUrls(item, urls);
    }
  }
  return urls;
}

function rewriteMediaUrls(value, replacements) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => rewriteMediaUrls(item, replacements));

  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" && replacements[item]) {
      result[key] = replacements[item];
    } else if (item && typeof item === "object") {
      result[key] = rewriteMediaUrls(item, replacements);
    } else {
      result[key] = item;
    }
  }
  return result;
}

function safeMediaFileName(mediaUrl) {
  try {
    const fileName = decodeURIComponent(mediaUrl.slice(mediaRoutePrefix.length));
    if (!fileName || fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) return "";
    return fileName;
  } catch {
    return "";
  }
}

async function buildGamePackage(game) {
  const media = [];
  const mediaUrls = collectMediaUrls(game);

  for (const mediaUrl of mediaUrls) {
    const fileName = safeMediaFileName(mediaUrl);
    if (!fileName) continue;
    try {
      const filePath = path.join(getMediaDir(), fileName);
      const data = await fs.readFile(filePath);
      media.push({
        url: mediaUrl,
        name: fileName,
        type: mediaContentType(filePath),
        data: data.toString("base64")
      });
    } catch {
      // Keep the game export usable even if an old local media file is missing.
    }
  }

  return {
    format: "svoya-igra-game",
    version: gamePackageVersion,
    exportedAt: new Date().toISOString(),
    game,
    media
  };
}

async function restoreGamePackage(gamePackage) {
  if (!gamePackage || gamePackage.format !== "svoya-igra-game" || !gamePackage.game) {
    throw new Error("Это не файл игры Svoya Igra.");
  }

  const replacements = {};
  const mediaItems = Array.isArray(gamePackage.media) ? gamePackage.media : [];
  if (mediaItems.length) {
    await fs.mkdir(getMediaDir(), { recursive: true });
  }

  for (const item of mediaItems) {
    if (!item || typeof item.url !== "string" || typeof item.data !== "string") continue;
    const buffer = Buffer.from(item.data, "base64");
    const fileName = `${crypto.randomUUID()}${mediaExtension(item.name || "", item.type || "")}`;
    await fs.writeFile(path.join(getMediaDir(), fileName), buffer);
    replacements[item.url] = `${mediaRoutePrefix}${encodeURIComponent(fileName)}`;
  }

  return rewriteMediaUrls(gamePackage.game, replacements);
}

async function serveMedia(request, response, requestUrl) {
  try {
    const fileName = decodeURIComponent(requestUrl.pathname.slice(mediaRoutePrefix.length));
    if (!fileName || fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
      response.writeHead(400);
      response.end("Bad media path");
      return;
    }
    const filePath = path.join(getMediaDir(), fileName);
    const data = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mediaContentType(filePath),
      "Cache-Control": "public, max-age=31536000, immutable"
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end("Media not found");
  }
}

ipcMain.handle("media:save-file", async (_event, file) => {
  const buffer = Buffer.from(file.bytes);

  if (isDev) {
    return { url: `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}` };
  }

  await fs.mkdir(getMediaDir(), { recursive: true });
  const fileName = `${crypto.randomUUID()}${mediaExtension(file.name || "", file.type || "")}`;
  await fs.writeFile(path.join(getMediaDir(), fileName), buffer);
  return { url: `${mediaRoutePrefix}${encodeURIComponent(fileName)}` };
});

ipcMain.handle("game-files:export", async (_event, game) => {
  if (!game || typeof game !== "object") {
    return { ok: false, message: "Не удалось сохранить игру: данные игры не найдены." };
  }

  const safeTitle = String(game.title || "svoya-igra")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .slice(0, 80) || "svoya-igra";
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Сохранить игру",
    defaultPath: `${safeTitle}.svoyaigra`,
    filters: [{ name: "Файл игры Svoya Igra", extensions: ["svoyaigra"] }]
  });

  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true };
  }

  const gamePackage = await buildGamePackage(game);
  await fs.writeFile(result.filePath, JSON.stringify(gamePackage), "utf8");
  return { ok: true, path: result.filePath, mediaCount: gamePackage.media.length };
});

ipcMain.handle("game-files:import", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Открыть игру",
    properties: ["openFile"],
    filters: [
      { name: "Файл игры Svoya Igra", extensions: ["svoyaigra"] },
      { name: "JSON", extensions: ["json"] }
    ]
  });

  if (result.canceled || !result.filePaths[0]) {
    return { ok: false, canceled: true };
  }

  const raw = await fs.readFile(result.filePaths[0], "utf8");
  const parsed = JSON.parse(raw);
  const game = parsed && parsed.format === "svoya-igra-game" ? await restoreGamePackage(parsed) : parsed;
  return { ok: true, game };
});

ipcMain.handle("game-files:reveal", async (_event, filePath) => {
  if (!filePath || typeof filePath !== "string") return { ok: false };
  shell.showItemInFolder(filePath);
  return { ok: true };
});

function parseSimpleYaml(value) {
  return value.split(/\r?\n/).reduce((result, line) => {
    const match = line.match(/^\s*([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (!match) return result;
    const rawValue = match[2].replace(/^["']|["']$/g, "");
    result[match[1]] = rawValue;
    return result;
  }, {});
}

function getPackagedUpdateConfig() {
  const candidates = [
    path.join(process.resourcesPath || "", "app-update.yml"),
    path.join(path.dirname(app.getPath("exe")), "resources", "app-update.yml")
  ];

  for (const filePath of candidates) {
    try {
      if (filePath && fsSync.existsSync(filePath)) {
        return parseSimpleYaml(fsSync.readFileSync(filePath, "utf8"));
      }
    } catch {
      // Try the next known electron-builder location.
    }
  }

  return null;
}

function getUpdatePublishConfig() {
  const packagedConfig = isDev ? null : getPackagedUpdateConfig();
  if (isUpdateFeedConfigured(packagedConfig)) return packagedConfig;

  try {
    const packageJson = require(path.join(getAppDir(), "package.json"));
    const publish = packageJson.build && packageJson.build.publish;
    const firstPublish = Array.isArray(publish) ? publish[0] : publish;
    if (isUpdateFeedConfigured(firstPublish)) return firstPublish;
  } catch {
    // Fall back to the release channel that is also written to app-update.yml by electron-builder.
  }

  return defaultPublishConfig;
}

function describeUpdateChannel(config) {
  if (!config) return "";
  if (config.provider === "github" && config.owner && config.repo) {
    return `https://github.com/${config.owner}/${config.repo}/releases`;
  }
  if (config.provider === "generic") return config.url || "";
  return "";
}

function isUpdateFeedConfigured(config) {
  if (!config) return false;
  if (config.provider === "github") return Boolean(config.owner && config.repo);
  if (config.provider === "generic") return Boolean(config.url && !config.url.includes("example.com"));
  return false;
}

function sendUpdateStatus(patch) {
  updateStatus = {
    ...updateStatus,
    ...patch,
    currentVersion: app.getVersion(),
    feedUrl: describeUpdateChannel(getUpdatePublishConfig())
  };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("updates:status", updateStatus);
  }
  return updateStatus;
}

function isMacCodeSignatureUpdateError(error) {
  if (process.platform !== "darwin") return false;
  const message = error instanceof Error ? error.message : String(error);
  return /Code signature at URL|did not pass validation|code signature|подпис/i.test(message);
}

function updateErrorPatch(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (isMacCodeSignatureUpdateError(error)) {
    return {
      status: "error",
      message:
        "macOS не смогла установить обновление автоматически из-за подписи текущей версии. Скачайте последнюю DMG-сборку вручную и замените приложение. Игры и игроки сохранятся.",
      manualUrl: releasesUrl,
      technicalMessage: message,
      progress: undefined
    };
  }

  return {
    status: "error",
    message,
    progress: undefined
  };
}

autoUpdater.on("checking-for-update", () => {
  sendUpdateStatus({ status: "checking", message: "Проверяем обновления..." });
});

autoUpdater.on("update-available", (info) => {
  sendUpdateStatus({
    status: "available",
    message: `Доступна версия ${info.version}.`,
    updateVersion: info.version,
    progress: undefined
  });
});

autoUpdater.on("update-not-available", () => {
  sendUpdateStatus({
    status: "not-available",
    message: "Установлена последняя версия.",
    updateVersion: undefined,
    progress: undefined
  });
});

autoUpdater.on("download-progress", (progress) => {
  sendUpdateStatus({
    status: "downloading",
    message: `Скачиваем обновление: ${Math.round(progress.percent)}%.`,
    progress: Math.round(progress.percent)
  });
});

autoUpdater.on("update-downloaded", (info) => {
  sendUpdateStatus({
    status: "downloaded",
    message: `Версия ${info.version} скачана. Перезапустите приложение для установки.`,
    updateVersion: info.version,
    progress: 100
  });
});

autoUpdater.on("error", (error) => {
  sendUpdateStatus(updateErrorPatch(error));
});

ipcMain.handle("updates:get-status", () => sendUpdateStatus({}));

ipcMain.handle("updates:check", async () => {
  const publishConfig = getUpdatePublishConfig();
  const feedUrl = describeUpdateChannel(publishConfig);
  if (isDev) {
    return sendUpdateStatus({ status: "disabled", message: "Проверка обновлений доступна только в установленной сборке.", feedUrl });
  }
  if (!isUpdateFeedConfigured(publishConfig)) {
    return sendUpdateStatus({ status: "disabled", message: "Канал обновлений не настроен.", feedUrl });
  }
  autoUpdater.setFeedURL(publishConfig);
  try {
    await autoUpdater.checkForUpdates();
    return updateStatus;
  } catch (error) {
    return sendUpdateStatus(updateErrorPatch(error));
  }
});

ipcMain.handle("updates:download", async () => {
  try {
    await autoUpdater.downloadUpdate();
    return sendUpdateStatus({ status: "downloading", message: "Скачиваем обновление..." });
  } catch (error) {
    return sendUpdateStatus(updateErrorPatch(error));
  }
});

ipcMain.handle("updates:install", () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle("updates:open-release", async () => {
  await shell.openExternal(releasesUrl);
  return { ok: true };
});

async function createNextServer() {
  if (isDev) {
    return "http://localhost:3000";
  }

  const nextApp = next({
    dev: false,
    dir: getAppDir(),
    hostname: "127.0.0.1"
  });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
    if (requestUrl.pathname.startsWith(mediaRoutePrefix)) {
      void serveMedia(request, response, requestUrl);
      return;
    }
    handle(request, response);
  });

  return await new Promise((resolve, reject) => {
    server.once("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        reject(new Error("Приложение уже запущено или порт занят. Закройте второе окно приложения и запустите снова."));
        return;
      }
      reject(error);
    });
    server.listen(packagedPort, "127.0.0.1", () => {
      resolve(`http://127.0.0.1:${packagedPort}`);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "Своя игра",
    icon: getWindowIcon(),
    backgroundColor: "#071331",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  try {
    const url = await createNextServer();
    await mainWindow.loadURL(url);
  } catch (error) {
    dialog.showErrorBox("Ошибка запуска", error instanceof Error ? error.message : String(error));
    app.quit();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (server) {
    server.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
