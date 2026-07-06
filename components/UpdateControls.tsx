"use client";

import { useEffect, useState } from "react";

type UpdateStatus = {
  status: "idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error" | "disabled";
  message: string;
  currentVersion?: string;
  updateVersion?: string;
  progress?: number;
};

type UpdateApi = {
  getStatus: () => Promise<UpdateStatus>;
  check: () => Promise<UpdateStatus>;
  download: () => Promise<UpdateStatus>;
  install: () => Promise<void>;
  onStatus: (callback: (status: UpdateStatus) => void) => () => void;
};

declare global {
  interface Window {
    svoyaIgraUpdates?: UpdateApi;
  }
}

export function UpdateControls() {
  const [api, setApi] = useState<UpdateApi | null>(null);
  const [status, setStatus] = useState<UpdateStatus | null>(null);

  useEffect(() => {
    if (!window.svoyaIgraUpdates) return;
    const updates = window.svoyaIgraUpdates;
    setApi(updates);
    void updates.getStatus().then(setStatus);
    return updates.onStatus(setStatus);
  }, []);

  if (!api) return null;

  const busy = status?.status === "checking" || status?.status === "downloading";

  return (
    <div className="panel space-y-2 p-3 text-sm text-white/75">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-bold text-white">Обновления</div>
          {status?.currentVersion ? <div>Текущая версия: {status.currentVersion}</div> : null}
        </div>
        {status?.status === "available" ? (
          <button className="btn btn-primary" type="button" onClick={() => void api.download()} disabled={busy}>
            Скачать
          </button>
        ) : status?.status === "downloaded" ? (
          <button className="btn btn-primary" type="button" onClick={() => void api.install()}>
            Установить
          </button>
        ) : (
          <button className="btn btn-secondary" type="button" onClick={() => void api.check().then(setStatus)} disabled={busy}>
            Проверить
          </button>
        )}
      </div>
      {status?.message ? <div>{status.message}</div> : null}
      {typeof status?.progress === "number" ? (
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-prize" style={{ width: `${status.progress}%` }} />
        </div>
      ) : null}
    </div>
  );
}
