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
    <div className="space-y-3">
      {state.players.map((player) => (
        <div className="grid gap-3 rounded-lg bg-white/[0.035] p-3" key={player.id}>
          <div className="flex items-center gap-3">
            <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} size="sm" />
            <div>
              <div className="font-bold text-white/80">{player.name}</div>
              <div className="text-sm text-white/45">Текущий счёт: {player.score}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center">
            <div className="flex gap-2">
              <button
                className="btn btn-secondary"
                disabled={state.scoreEvents.some((event) => event.playerId === player.id && event.questionId === questionId)}
                type="button"
                onClick={() => applyScore(player.id, price)}
              >
                +{price}
              </button>
              <button
                className="btn btn-secondary"
                disabled={state.scoreEvents.some((event) => event.playerId === player.id && event.questionId === questionId)}
                type="button"
                onClick={() => applyScore(player.id, -price)}
              >
                -{price}
              </button>
            </div>
            <button className="btn btn-secondary ml-10 px-3" type="button" aria-label="Отменить" onClick={() => undo(player.id)}>
              <Undo2 size={18} />
            </button>
          </div>
        </div>
      ))}
      {!state.players.length ? <p className="text-white/65">Добавьте игроков в админке.</p> : null}
    </div>
  );
}
