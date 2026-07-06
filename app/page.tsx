"use client";

import Link from "next/link";
import { useState } from "react";
import { UpdateControls } from "@/components/UpdateControls";
import { resetGameForStart, validateGameReady } from "@/lib/game";
import { useGameState } from "@/lib/useGameState";

export default function HomePage() {
  const { state, setState } = useGameState();
  const [message, setMessage] = useState("");

  return (
    <main className="relative flex min-h-screen flex-col justify-end bg-board p-8">
      <div className="pointer-events-none absolute inset-0 grid place-items-center px-8 pb-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Своя игра"
          className="max-h-[48vh] w-full max-w-4xl object-contain"
        />
      </div>
      <div className="relative z-10 mx-auto mb-10 w-full max-w-md space-y-3">
        {message ? (
          <div className="panel whitespace-pre-line border-amber-300/40 p-4 text-center text-amber-100">
            <p className="mb-3">{message}</p>
            <Link className="btn btn-primary w-full" href="/admin">
              Перейти в админку
            </Link>
          </div>
        ) : null}
        <Link
          className="btn btn-primary w-full py-5 text-2xl"
          href="/game"
          style={{ backgroundColor: "#ffd900", borderColor: "#ffd900", color: "#001448" }}
          onClick={(event) => {
            const error = validateGameReady(state);
            if (error) {
              event.preventDefault();
              setMessage(error);
              return;
            }
            setState((current) => resetGameForStart(current));
          }}
        >
          Начать игру
        </Link>
        <Link className="btn btn-secondary w-full py-4 text-xl" href="/admin">
          Админка
        </Link>
        <UpdateControls />
      </div>
    </main>
  );
}
