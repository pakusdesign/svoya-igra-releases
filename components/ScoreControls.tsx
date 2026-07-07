"use client";

import { Undo2 } from "lucide-react";
import { id } from "@/lib/game";
import type { GameState } from "@/lib/types";
import { PlayerAvatar } from "./PlayerAvatar";

type Props = {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  questionId: string;
  price: number;
};

export function ScoreControls({ state, setState, questionId, price }: Props) {
  function applyScore(playerId: string, delta: number) {
    setState((current) => {
      const alreadyScored = current.scoreEvents.some((event) => event.playerId === playerId && event.questionId === questionId);
      if (alreadyScored) return current;
      return {
        ...current,
        players: current.players.map((player) => (player.id === playerId ? { ...player, score: player.score + delta } : player)),
        scoreEvents: [...current.scoreEvents, { id: id("score"), playerId, questionId, delta, createdAt: new Date().toISOString() }]
      };
    });
  }

  function undo(playerId: string) {
    const last = [...state.scoreEvents].reverse().find((event) => event.playerId === playerId && event.questionId === questionId);
    if (!last) return;
    setState((current) => ({
      ...current,
      players: current.players.map((player) => (player.id === playerId ? { ...player, score: player.score - last.delta } : player)),
      scoreEvents: current.scoreEvents.filter((event) => event.id !== last.id)
    }));
  }

  return (
    <div className="grid shrink-0 gap-1.5">
      {state.players.map((player) => (
        <div className="grid gap-1.5 rounded-lg bg-white/[0.035] p-2" key={player.id}>
          <div className="flex items-center gap-2">
            <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} size="xs" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold text-white/85">{player.name}</div>
              <div className="truncate text-xs text-white/45">Счёт: {player.score}</div>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1fr_32px] items-center gap-1.5">
            <div className="contents">
              <button
                className="btn btn-secondary h-8 min-h-8 min-w-0 px-1 text-sm leading-none"
                disabled={state.scoreEvents.some((event) => event.playerId === player.id && event.questionId === questionId)}
                type="button"
                onClick={() => applyScore(player.id, price)}
              >
                +{price}
              </button>
              <button
                className="btn btn-secondary h-8 min-h-8 min-w-0 px-1 text-sm leading-none"
                disabled={state.scoreEvents.some((event) => event.playerId === player.id && event.questionId === questionId)}
                type="button"
                onClick={() => applyScore(player.id, -price)}
              >
                -{price}
              </button>
            </div>
            <button className="btn btn-secondary h-8 min-h-8 w-8 p-0" type="button" aria-label="Отменить" onClick={() => undo(player.id)}>
              <Undo2 className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ))}
      {!state.players.length ? <p className="text-white/65">Добавьте игроков в админке.</p> : null}
    </div>
  );
}
