"use client";

import { Trash2 } from "lucide-react";
import type { Player } from "@/lib/types";
import { PlayerAvatar } from "./PlayerAvatar";

type Props = {
  players: Player[];
  onRemove: (playerId: string) => void;
};

export function CurrentGamePlayers({ players, onRemove }: Props) {
  return (
    <div className="panel p-5">
      <h3 className="mb-4 text-xl font-black">Игроки текущей игры</h3>
      <div className="space-y-3">
        {players.map((player) => (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-3" key={player.id}>
            <div className="flex items-center gap-3">
              <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} />
              <div>
                <div className="font-bold">{player.name}</div>
                <div className="text-sm text-white/65">{player.score} баллов</div>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => onRemove(player.id)} type="button">
              <Trash2 size={18} /> Удалить из игры
            </button>
          </div>
        ))}
        {!players.length ? <p className="text-white/65">В текущей игре пока нет игроков.</p> : null}
      </div>
    </div>
  );
}
