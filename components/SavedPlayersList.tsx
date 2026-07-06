"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Player, SavedPlayer } from "@/lib/types";
import { PlayerAvatar } from "./PlayerAvatar";

type Props = {
  savedPlayers: SavedPlayer[];
  players: Player[];
  onAdd: (savedPlayer: SavedPlayer) => void;
  onEdit: (savedPlayer: SavedPlayer) => void;
  onDelete: (savedPlayerId: string) => void;
};

export function SavedPlayersList({ savedPlayers, players, onAdd, onEdit, onDelete }: Props) {
  return (
    <div className="panel p-5">
      <h3 className="mb-4 text-xl font-black">Сохранённые игроки</h3>
      <div className="space-y-3">
        {savedPlayers.map((savedPlayer) => {
          const inGame = players.some((player) => player.savedPlayerId === savedPlayer.id);
          const full = players.length >= 6;
          return (
            <div className="grid gap-3 rounded-lg bg-white/5 p-3 md:grid-cols-[1fr_auto]" key={savedPlayer.id}>
              <div className="flex items-center gap-3">
                <PlayerAvatar name={savedPlayer.name} avatarUrl={savedPlayer.avatarUrl} />
                <div className="font-bold">{savedPlayer.name}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary" disabled={inGame || full} onClick={() => onAdd(savedPlayer)} type="button">
                  <Plus size={18} /> {inGame ? "Уже в игре" : "Добавить в игру"}
                </button>
                <button className="btn btn-secondary" onClick={() => onEdit(savedPlayer)} type="button">
                  <Pencil size={18} /> Редактировать
                </button>
                <button className="btn btn-secondary" onClick={() => onDelete(savedPlayer.id)} type="button">
                  <Trash2 size={18} /> Удалить
                </button>
              </div>
            </div>
          );
        })}
        {!savedPlayers.length ? <p className="text-white/65">Сохранённых игроков пока нет.</p> : null}
      </div>
    </div>
  );
}
