"use client";

import { useEffect, useState } from "react";

export function TimerLoader({ seconds = 15, rightOffset = 24 }: { seconds?: number; rightOffset?: number }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [seconds]);

  const progress = ((seconds - remaining) / seconds) * 100;
  return (
    <div className="fixed bottom-6 flex items-center gap-3 rounded-full border border-white/15 bg-black/40 px-4 py-3 backdrop-blur" style={{ right: rightOffset }}>
      <div
        className="grid h-14 w-14 place-items-center rounded-full text-lg font-black text-white"
        style={{
          background: `conic-gradient(${remaining === 0 ? "#ef4444" : "#ffd84d"} ${progress}%, rgba(255,255,255,.14) 0)`
        }}
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-board">{remaining}</div>
      </div>
      <span className="font-bold">{remaining === 0 ? "Время вышло" : "Секунд"}</span>
    </div>
  );
}
