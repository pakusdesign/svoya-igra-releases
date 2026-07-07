"use client";

import { useEffect, useState } from "react";

type UpdateStatus = {
  status: "idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error" | "disabled";
  message: string;
  currentVersion?: string;
  updateVersion?: string;
  progress?: number;
  manualUrl?: string;
  technicalMessage?: string;
};

type UpdateApi = {
  getStatus: () => Promise<UpdateStatus>;
  check: () => Promise<UpdateStatus>;
  download: () => Promise<UpdateStatus>;
  install: () => Promise<void>;
  openRelease: () => Promise<void>;
  onStatus: (callback: (status: UpdateStatus) => void) => () => void;
};

declare global {
  interface Window {
    svoyaIgraUpdates?: UpdateApi;
  }
}

type UpdateControlsProps = {
  compact?: boolean;
};

export function UpdateControls({ compact = false }: UpdateControlsProps) {
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
  const version = status?.currentVersion ? `v${status.currentVersion}` : "";
  const runAction = (action: () => Promise<UpdateStatus | void>) => {
    void action().then((nextStatus) => {
      if (nextStatus) setStatus(nextStatus);
    });
  };
  const action =
    status?.status === "error" && status.manualUrl
      ? { label: "Открыть релиз", onClick: () => runAction(api.openRelease), primary: true }
      : status?.status === "available"
        ? { label: "Скачать", onClick: () => runAction(api.download), primary: true }
      : status?.status === "downloaded"
        ? { label: "Установить", onClick: () => runAction(api.install), primary: true }
        : { label: busy ? "Проверяем..." : "Проверить", onClick: () => runAction(api.check), primary: false };

  if (compact) {
    return (
      <div className="panel flex min-h-11 items-center gap-3 px-3 py-2 text-sm text-white/75">
        <span className="whitespace-nowrap font-semibold text-white">{version || "Версия"}</span>
        <button className={`btn ${action.primary ? "btn-primary" : "btn-secondary"} h-8 min-h-8 px-3 text-sm`} type="button" onClick={action.onClick} disabled={busy}>
          {action.label}
        </button>
      </div>
    );
  }

  return (
    <div className="panel space-y-2 p-3 text-sm text-white/75">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-bold text-white">Обновления</div>
          {status?.currentVersion ? <div>Текущая версия: {status.currentVersion}</div> : null}
        </div>
        <button className={`btn ${action.primary ? "btn-primary" : "btn-secondary"}`} type="button" onClick={action.onClick} disabled={busy}>
          {action.label}
        </button>
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
