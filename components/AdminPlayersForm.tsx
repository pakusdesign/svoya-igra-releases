"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { id } from "@/lib/game";
import { savePersistentFile } from "@/lib/persistentFile";
import type { GameState, SavedPlayer } from "@/lib/types";
import { PlayerAvatar } from "./PlayerAvatar";

type Props = {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
};

type Draft = {
  id?: string;
  name: string;
  avatarUrl?: string;
};

function AvatarPicker({
  name,
  avatarUrl,
  onChange
}: {
  name: string;
  avatarUrl?: string;
  onChange: (avatarUrl?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <button className="rounded-full" type="button" onClick={() => inputRef.current?.click()} aria-label="Изменить аватар">
        <PlayerAvatar name={name} avatarUrl={avatarUrl} />
      </button>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) onChange(await savePersistentFile(file));
        }}
      />
    </>
  );
}

export function AdminPlayersForm({ state, setState }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");

  function startCreate() {
    setMessage("");
    setDraft({ name: "", avatarUrl: undefined });
  }

  function startEdit(player: SavedPlayer) {
    setMessage("");
    setDraft({ id: player.id, name: player.name, avatarUrl: player.avatarUrl });
  }

  function cancel() {
    setDraft(null);
    setMessage("");
  }

  function saveDraft() {
    if (!draft?.name.trim()) {
      setMessage("У игрока должно быть имя.");
      return;
    }

    const now = new Date().toISOString();
    setState((current) => {
      if (draft.id) {
        return {
          ...current,
          savedPlayers: current.savedPlayers.map((player) =>
            player.id === draft.id ? { ...player, name: draft.name.trim(), avatarUrl: draft.avatarUrl, updatedAt: now } : player
          ),
          players: current.players.map((player) =>
            player.savedPlayerId === draft.id ? { ...player, name: draft.name.trim(), avatarUrl: draft.avatarUrl } : player
          )
        };
      }

      const savedPlayer: SavedPlayer = {
        id: id("saved-player"),
        name: draft.name.trim(),
        avatarUrl: draft.avatarUrl,
        createdAt: now,
        updatedAt: now
      };

      return { ...current, savedPlayers: [...current.savedPlayers, savedPlayer] };
    });
    setDraft(null);
    setMessage("");
  }

  return (
    <section className="space-y-5" id="players">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-display">Игроки</h1>
          <p className="admin-muted">В текущей игре может быть от 1 до 6 игроков.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={startCreate}>
          Создать игрока
        </button>
      </div>
      {message ? <div className="panel border-amber-300/40 p-4 text-amber-200">{message}</div> : null}

      <div className="panel overflow-x-auto p-0">
        <table className="admin-data-table min-w-[720px]">
          <thead>
            <tr>
              <th className="w-24">Аватар</th>
              <th>Имя</th>
              <th className="w-72 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {draft && !draft.id ? (
              <tr className="bg-[var(--colorNeutralBackground3)]">
                <td>
                  <AvatarPicker
                    name={draft.name}
                    avatarUrl={draft.avatarUrl}
                    onChange={(avatarUrl) => setDraft((current) => (current ? { ...current, avatarUrl } : current))}
                  />
                </td>
                <td>
                  <input
                    className="field"
                    autoFocus
                    placeholder="Имя игрока"
                    value={draft.name}
                    onChange={(event) => setDraft((current) => (current ? { ...current, name: event.target.value } : current))}
                  />
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button className="btn btn-secondary" type="button" onClick={cancel}>
                      Отмена
                    </button>
                    <button className="btn btn-primary" type="button" onClick={saveDraft}>
                      Сохранить
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}

            {state.savedPlayers.map((player) => {
              const isEditing = draft?.id === player.id;
              return (
                <tr key={player.id}>
                  <td>
                    {isEditing ? (
                      <AvatarPicker
                        name={draft.name}
                        avatarUrl={draft.avatarUrl}
                        onChange={(avatarUrl) => setDraft((current) => (current ? { ...current, avatarUrl } : current))}
                      />
                    ) : (
                      <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} />
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="field"
                        autoFocus
                        value={draft.name}
                        onChange={(event) => setDraft((current) => (current ? { ...current, name: event.target.value } : current))}
                      />
                    ) : (
                      <div className="admin-subtitle">{player.name}</div>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button className="btn btn-secondary" type="button" onClick={cancel}>
                            Отмена
                          </button>
                          <button className="btn btn-primary" type="button" onClick={saveDraft}>
                            Сохранить
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-secondary" type="button" onClick={() => startEdit(player)}>
                            <Pencil size={18} /> Редактировать
                          </button>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() =>
                              setState((current) => ({
                                ...current,
                                savedPlayers: current.savedPlayers.filter((item) => item.id !== player.id),
                                players: current.players.filter((item) => item.savedPlayerId !== player.id),
                                scoreEvents: current.scoreEvents.filter(
                                  (event) => !current.players.some((item) => item.savedPlayerId === player.id && item.id === event.playerId)
                                )
                              }))
                            }
                          >
                            <Trash2 size={18} /> Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!state.savedPlayers.length && !draft ? <div className="admin-muted p-6">Созданных игроков пока нет.</div> : null}
      </div>
    </section>
  );
}
