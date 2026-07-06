"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { id } from "@/lib/game";
import type { GameState, SavedPlayer } from "@/lib/types";
import { PlayerAvatar } from "./PlayerAvatar";

type Props = {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
};

const SAVED_PLAYER_DRAG_TYPE = "application/x-svoya-saved-player-ids";
const GAME_PLAYER_DRAG_TYPE = "application/x-svoya-game-player-ids";

type SelectAllCheckboxProps = {
  checked: boolean;
  disabled: boolean;
  indeterminate: boolean;
  label: string;
  onChange: () => void;
};

function SelectAllCheckbox({ checked, disabled, indeterminate, label, onChange }: SelectAllCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!checkboxRef.current) return;
    checkboxRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className="grid min-h-10 min-w-8 cursor-pointer place-items-center" aria-label={label}>
      <input
        ref={checkboxRef}
        className="h-4 w-4 accent-[var(--colorBrandBackground)]"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-checked={indeterminate ? "mixed" : checked}
        onChange={onChange}
      />
    </label>
  );
}

export function AdminGamePlayers({ state, setState }: Props) {
  const [draftName, setDraftName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedSavedPlayerIds, setSelectedSavedPlayerIds] = useState<string[]>([]);
  const [selectedGamePlayerIds, setSelectedGamePlayerIds] = useState<string[]>([]);
  const [draggedSavedPlayerIds, setDraggedSavedPlayerIds] = useState<string[]>([]);
  const [draggedGamePlayerIds, setDraggedGamePlayerIds] = useState<string[]>([]);
  const [dragOverRoster, setDragOverRoster] = useState(false);
  const [dragOverSavedPlayers, setDragOverSavedPlayers] = useState(false);
  const playerLimit = 6;

  const savedPlayerIdsInGame = new Set(state.players.map((player) => player.savedPlayerId).filter(Boolean));
  const availableSavedPlayers = state.savedPlayers.filter((player) => !savedPlayerIdsInGame.has(player.id));
  const availableSavedPlayerIds = availableSavedPlayers.map((player) => player.id);
  const canCreatePlayer = draftName.trim().length > 2;
  const selectedSavedPlayers = availableSavedPlayers.filter((player) => selectedSavedPlayerIds.includes(player.id));
  const selectedAvailableSavedPlayerIds = selectedSavedPlayerIds.filter((playerId) => availableSavedPlayerIds.includes(playerId));
  const allSavedPlayersSelected =
    availableSavedPlayerIds.length > 0 && availableSavedPlayerIds.every((playerId) => selectedSavedPlayerIds.includes(playerId));
  const allGamePlayersSelected = state.players.length > 0 && state.players.every((player) => selectedGamePlayerIds.includes(player.id));
  const someSavedPlayersSelected = selectedAvailableSavedPlayerIds.length > 0 && !allSavedPlayersSelected;
  const someGamePlayersSelected = selectedGamePlayerIds.length > 0 && !allGamePlayersSelected;

  function addPlayer(savedPlayer: SavedPlayer) {
    addPlayers([savedPlayer]);
  }

  function addPlayers(savedPlayers: SavedPlayer[]) {
    const existingSavedPlayerIds = new Set(state.players.map((player) => player.savedPlayerId).filter(Boolean));
    const availableSlots = playerLimit - state.players.length;
    const playersToAdd = savedPlayers
      .filter((savedPlayer) => !existingSavedPlayerIds.has(savedPlayer.id))
      .slice(0, availableSlots);

    if (availableSlots <= 0) {
      setMessage("В игре уже 6 игроков.");
      return;
    }

    if (!playersToAdd.length) {
      setMessage("Выбранные игроки уже добавлены в игру.");
      return;
    }

    setState((current) => ({
      ...current,
      players: [
        ...current.players,
        ...playersToAdd.map((savedPlayer) => ({
          id: id("player"),
          savedPlayerId: savedPlayer.id,
          name: savedPlayer.name,
          avatarUrl: savedPlayer.avatarUrl,
          score: 0
        }))
      ]
    }));
    setSelectedSavedPlayerIds((current) => current.filter((playerId) => !playersToAdd.some((player) => player.id === playerId)));
    setMessage(playersToAdd.length < savedPlayers.length ? `Добавлено ${playersToAdd.length}. Остальные уже в игре или не помещаются в лимит.` : "");
  }

  function createPlayer() {
    const name = draftName.trim();
    if (name.length <= 2) {
      setMessage("Имя игрока должно быть длиннее 2 символов.");
      return;
    }

    const now = new Date().toISOString();
    const savedPlayer: SavedPlayer = {
      id: id("saved-player"),
      name,
      createdAt: now,
      updatedAt: now
    };

    setState((current) => ({
      ...current,
      savedPlayers: [...current.savedPlayers, savedPlayer],
      players:
        current.players.length >= playerLimit
          ? current.players
          : [
              ...current.players,
              {
                id: id("player"),
                savedPlayerId: savedPlayer.id,
                name: savedPlayer.name,
                avatarUrl: savedPlayer.avatarUrl,
                score: 0
              }
            ]
    }));
    setDraftName("");
    setMessage(currentMessage(state.players.length >= playerLimit));
  }

  function currentMessage(gameFull: boolean) {
    return gameFull ? "Игрок создан в общем списке. В текущую игру его можно добавить после удаления одного из игроков." : "";
  }

  function removePlayers(playerIds: string[]) {
    if (!playerIds.length) return;
    const playerIdSet = new Set(playerIds);
    setState((current) => ({
      ...current,
      players: current.players.filter((player) => !playerIdSet.has(player.id)),
      scoreEvents: current.scoreEvents.filter((event) => !playerIdSet.has(event.playerId))
    }));
    setSelectedGamePlayerIds((current) => current.filter((playerId) => !playerIdSet.has(playerId)));
    setDraggedGamePlayerIds([]);
    setDragOverSavedPlayers(false);
    setMessage("");
  }

  function toggleSavedPlayerSelection(playerId: string) {
    setSelectedSavedPlayerIds((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]
    );
  }

  function toggleGamePlayerSelection(playerId: string) {
    setSelectedGamePlayerIds((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]
    );
  }

  function toggleAllSavedPlayers() {
    setSelectedSavedPlayerIds(allSavedPlayersSelected ? [] : availableSavedPlayerIds);
  }

  function toggleAllGamePlayers() {
    setSelectedGamePlayerIds(allGamePlayersSelected ? [] : state.players.map((player) => player.id));
  }

  function dragSavedPlayerIds(savedPlayerId: string) {
    return selectedSavedPlayerIds.includes(savedPlayerId) ? selectedSavedPlayerIds : [savedPlayerId];
  }

  function dragGamePlayerIds(gamePlayerId: string) {
    return selectedGamePlayerIds.includes(gamePlayerId) ? selectedGamePlayerIds : [gamePlayerId];
  }

  function handleSavedPlayerDragStart(event: DragEvent<HTMLElement>, savedPlayerId: string) {
    const playerIds = dragSavedPlayerIds(savedPlayerId);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(SAVED_PLAYER_DRAG_TYPE, JSON.stringify(playerIds));
    setDraggedSavedPlayerIds(playerIds);
  }

  function handleGamePlayerDragStart(event: DragEvent<HTMLElement>, gamePlayerId: string) {
    const playerIds = dragGamePlayerIds(gamePlayerId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(GAME_PLAYER_DRAG_TYPE, JSON.stringify(playerIds));
    setDraggedGamePlayerIds(playerIds);
  }

  function droppedPlayerIds(event: DragEvent<HTMLElement>, type: string, fallbackIds: string[]) {
    const rawPlayerIds = event.dataTransfer.getData(type);
    if (!rawPlayerIds) return fallbackIds;

    try {
      const parsed = JSON.parse(rawPlayerIds);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : fallbackIds;
    } catch {
      return fallbackIds;
    }
  }

  function handleDragLeave(event: DragEvent<HTMLElement>, onLeave: () => void) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    onLeave();
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
      <div
        className={`panel overflow-hidden p-0 transition ${
          dragOverRoster ? "border-[var(--colorBrandStroke1)] bg-[var(--colorNeutralBackground3)]" : ""
        }`}
        onDragOver={(event) => {
          if (!draggedSavedPlayerIds.length) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDragOverRoster(true);
        }}
        onDragLeave={(event) => handleDragLeave(event, () => setDragOverRoster(false))}
        onDrop={(event) => {
          event.preventDefault();
          const playerIds = droppedPlayerIds(event, SAVED_PLAYER_DRAG_TYPE, draggedSavedPlayerIds);
          const savedPlayersToAdd = state.savedPlayers.filter((savedPlayer) => playerIds.includes(savedPlayer.id));
          addPlayers(savedPlayersToAdd);
          setDraggedSavedPlayerIds([]);
          setDragOverRoster(false);
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--colorNeutralStroke2)] p-5">
          <div>
            <h2 className="admin-title">Игроки на игру</h2>
            <p className="admin-muted">Состав команды для текущей игры.</p>
          </div>
          <div className="rounded border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground3)] px-3 py-1 text-sm font-semibold text-[var(--colorNeutralForeground1)]">
            {state.players.length}/{playerLimit}
          </div>
        </div>
        <div className="grid min-h-14 items-center border-b border-[var(--colorNeutralStroke2)] px-4 sm:grid-cols-[32px_1fr]">
          <SelectAllCheckbox
            checked={allGamePlayersSelected}
            disabled={!state.players.length}
            indeterminate={someGamePlayersSelected}
            label="Выбрать всех игроков в игре"
            onChange={toggleAllGamePlayers}
          />
          <div className="flex min-h-10 flex-wrap items-center gap-x-6 gap-y-2 pl-3">
            {selectedGamePlayerIds.length ? (
              <>
                <span className="admin-muted text-sm">Выбрано: {selectedGamePlayerIds.length}</span>
                <button className="btn btn-secondary" type="button" onClick={() => removePlayers(selectedGamePlayerIds)}>
                  <Trash2 size={18} /> Убрать выбранных
                </button>
              </>
            ) : null}
          </div>
        </div>
        <div className="divide-y divide-[var(--colorNeutralStroke2)]">
          {state.players.map((player) => {
            const selected = selectedGamePlayerIds.includes(player.id);
            return (
              <div
                className={`grid gap-3 p-4 transition sm:grid-cols-[32px_40px_auto_1fr_auto] sm:items-center ${
                  selected ? "bg-[var(--colorBrandBackground2)]" : ""
                }`}
                key={player.id}
              >
                <label className="grid min-h-10 min-w-8 cursor-pointer place-items-center">
                  <input
                    className="h-4 w-4 shrink-0 accent-[var(--colorBrandBackground)]"
                    type="checkbox"
                    checked={selected}
                    aria-label={`Выбрать игрока ${player.name}`}
                    onChange={() => toggleGamePlayerSelection(player.id)}
                    onClick={(event) => event.stopPropagation()}
                  />
                </label>
                <button
                  className="grid min-h-10 min-w-10 shrink-0 cursor-grab place-items-center rounded border border-transparent bg-transparent text-[var(--colorNeutralForeground3)] transition hover:bg-[var(--colorNeutralBackground3)] hover:text-[var(--colorNeutralForeground1)] active:cursor-grabbing"
                  type="button"
                  draggable
                  aria-label={`Перетащить игрока ${player.name}`}
                  onDragStart={(event) => handleGamePlayerDragStart(event, player.id)}
                  onDragEnd={() => {
                    setDraggedGamePlayerIds([]);
                    setDragOverSavedPlayers(false);
                  }}
                >
                  <GripVertical size={18} />
                </button>
                <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[var(--colorNeutralForeground1)]">{player.name}</div>
                  <div className="admin-muted text-sm">{player.score} баллов</div>
                </div>
                <button className="btn btn-secondary justify-self-start sm:justify-self-end" type="button" onClick={() => removePlayers([player.id])}>
                  <Trash2 size={18} /> Удалить
                </button>
              </div>
            );
          })}
        </div>
        {!state.players.length ? (
          <div className="grid min-h-48 place-items-center p-6 text-center">
            <div className="max-w-sm">
              <div className="admin-subtitle mb-1">В игре пока нет игроков</div>
              <p className="admin-muted">Создайте нового игрока или перетащите сохранённых игроков сюда.</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-5">
        <div className="panel p-5">
          <div className="mb-4">
            <h2 className="admin-title">Новый игрок</h2>
            <p className="admin-muted">Игрок сохранится в общий список и сразу добавится в игру.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              className="field"
              placeholder="Имя игрока"
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value);
                setMessage("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canCreatePlayer) createPlayer();
              }}
            />
            <button className="btn btn-primary" type="button" disabled={!canCreatePlayer} onClick={createPlayer}>
              <Plus size={18} /> Создать
            </button>
          </div>
          {message ? <div className="mt-3 text-sm text-amber-200">{message}</div> : null}
        </div>

        <div
          className={`panel overflow-hidden p-0 transition ${
            dragOverSavedPlayers ? "border-[var(--colorBrandStroke1)] bg-[var(--colorNeutralBackground3)]" : ""
          }`}
          onDragOver={(event) => {
            if (!draggedGamePlayerIds.length) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDragOverSavedPlayers(true);
          }}
          onDragLeave={(event) => handleDragLeave(event, () => setDragOverSavedPlayers(false))}
          onDrop={(event) => {
            event.preventDefault();
            const playerIds = droppedPlayerIds(event, GAME_PLAYER_DRAG_TYPE, draggedGamePlayerIds);
            removePlayers(playerIds);
            setDragOverSavedPlayers(false);
          }}
        >
          <div className="border-b border-[var(--colorNeutralStroke2)] p-5">
            <h2 className="admin-title">Сохранённые игроки</h2>
            <p className="admin-muted">Перетащите игроков в игру или выберите несколько.</p>
          </div>
          <div className="grid min-h-14 items-center border-b border-[var(--colorNeutralStroke2)] px-4 sm:grid-cols-[32px_1fr]">
            <SelectAllCheckbox
              checked={allSavedPlayersSelected}
              disabled={!availableSavedPlayerIds.length}
              indeterminate={someSavedPlayersSelected}
              label="Выбрать всех сохранённых игроков"
              onChange={toggleAllSavedPlayers}
            />
            <div className="flex min-h-10 flex-wrap items-center gap-x-6 gap-y-2 pl-3">
              {selectedAvailableSavedPlayerIds.length ? (
                <>
                  <span className="admin-muted text-sm">Выбрано: {selectedAvailableSavedPlayerIds.length}</span>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={state.players.length >= playerLimit}
                    onClick={() => addPlayers(selectedSavedPlayers)}
                  >
                    <Plus size={18} /> Добавить выбранных
                  </button>
                </>
              ) : null}
            </div>
          </div>
          <div className="divide-y divide-[var(--colorNeutralStroke2)]">
            {availableSavedPlayers.map((savedPlayer) => {
              const gameFull = state.players.length >= playerLimit;
              const selected = selectedSavedPlayerIds.includes(savedPlayer.id);
              const canAdd = !gameFull;
              return (
                <div
                  className={`grid gap-3 p-4 transition sm:grid-cols-[32px_40px_auto_1fr_auto] sm:items-center ${
                    selected ? "bg-[var(--colorBrandBackground2)]" : ""
                  }`}
                  key={savedPlayer.id}
                >
                  <label className="grid min-h-10 min-w-8 cursor-pointer place-items-center">
                    <input
                      className="h-4 w-4 shrink-0 accent-[var(--colorBrandBackground)]"
                      type="checkbox"
                      checked={selected}
                      aria-label={`Выбрать игрока ${savedPlayer.name}`}
                      onChange={() => toggleSavedPlayerSelection(savedPlayer.id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </label>
                  <button
                    className={`grid min-h-10 min-w-10 shrink-0 place-items-center rounded border border-transparent bg-transparent transition ${
                      canAdd
                        ? "cursor-grab text-[var(--colorNeutralForeground3)] hover:bg-[var(--colorNeutralBackground3)] hover:text-[var(--colorNeutralForeground1)] active:cursor-grabbing"
                        : "cursor-not-allowed text-[var(--colorNeutralForegroundDisabled)]"
                    }`}
                    type="button"
                    draggable={canAdd}
                    disabled={!canAdd}
                    aria-label={`Перетащить игрока ${savedPlayer.name}`}
                    onDragStart={(event) => handleSavedPlayerDragStart(event, savedPlayer.id)}
                    onDragEnd={() => {
                      setDraggedSavedPlayerIds([]);
                      setDragOverRoster(false);
                    }}
                  >
                    <GripVertical size={18} />
                  </button>
                  <PlayerAvatar name={savedPlayer.name} avatarUrl={savedPlayer.avatarUrl} />
                  <div className="min-w-0 truncate font-semibold text-[var(--colorNeutralForeground1)]">{savedPlayer.name}</div>
                  <button
                    className="btn btn-secondary justify-self-start sm:justify-self-end"
                    type="button"
                    disabled={gameFull}
                    onClick={() => addPlayer(savedPlayer)}
                  >
                    <Plus size={18} /> {gameFull ? "Лимит" : "Добавить"}
                  </button>
                </div>
              );
            })}
          </div>
          {!availableSavedPlayers.length ? <div className="admin-muted p-6">Нет игроков для добавления.</div> : null}
        </div>
      </div>
    </section>
  );
}
