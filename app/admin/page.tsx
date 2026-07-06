"use client";

import {
  Button,
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tab,
  TabList
} from "@fluentui/react-components";
import { useRouter } from "next/navigation";
import { createDemoState, createInitialState, id, resetGameForStart, validateGameReady } from "@/lib/game";
import { exportGameFile, importGameFile, isGameState, revealGameFile } from "@/lib/gameFiles";
import { useGamesLibrary } from "@/lib/useGamesLibrary";
import { AdminPlayersForm } from "@/components/AdminPlayersForm";
import type { GameState, SavedPlayer } from "@/lib/types";
import { ArrowLeft, Download, FolderOpen, MoreVertical, Pencil, Play, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";

type Draft = {
  id?: string;
  title: string;
};

export default function AdminPage() {
  const router = useRouter();
  const { games, loaded, activeState, persistGames, selectGame, updateGame } = useGamesLibrary();
  const [message, setMessage] = useState("");
  const [savedGamePath, setSavedGamePath] = useState("");
  const [tab, setTab] = useState<"games" | "players">("games");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [openActionsGameId, setOpenActionsGameId] = useState<string | null>(null);

  if (!loaded) return <main className="admin-shell p-6">Загрузка...</main>;

  const savedPlayersById = new Map<string, SavedPlayer>();
  for (const player of activeState.savedPlayers) {
    savedPlayersById.set(player.id, player);
  }
  for (const game of games) {
    for (const player of game.savedPlayers) {
      savedPlayersById.set(player.id, player);
    }
  }
  const savedPlayers = Array.from(savedPlayersById.values());

  function saveDraft() {
    setSavedGamePath("");
    if (!draft?.title.trim()) {
      setMessage("У игры должно быть название.");
      return;
    }

    if (draft.id) {
      persistGames(games.map((game) => (game.id === draft.id ? { ...game, title: draft.title.trim() } : game)));
    } else {
      const game: GameState = {
        ...createInitialState(),
        id: id("game"),
        title: draft.title.trim(),
        savedPlayers
      };
      persistGames([game, ...games]);
      selectGame(game);
    }

    setDraft(null);
    setMessage("");
  }

  function startGame(game: GameState) {
    setSavedGamePath("");
    const error = validateGameReady(game);
    if (error) {
      setMessage(error);
      return;
    }
    const startedGame = resetGameForStart(game);
    persistGames(games.map((item) => (item.id === startedGame.id ? startedGame : item)));
    selectGame(startedGame);
    router.push("/game");
  }

  function checkGame(game: GameState) {
    setSavedGamePath("");
    const error = validateGameReady(game);
    setMessage(error || `Игра «${game.title || "Без названия"}» готова к запуску.`);
  }

  function openGame(game: GameState) {
    setOpenActionsGameId(null);
    selectGame(game);
    router.push(`/admin/game/${game.id}`);
  }

  async function exportGame(game: GameState) {
    try {
      const result = await exportGameFile(game);
      if (result.canceled) return;
      if (!result.ok) {
        setSavedGamePath("");
        setMessage(result.message || "Не удалось сохранить игру.");
        return;
      }
      setSavedGamePath(result.path || "");
      setOpenActionsGameId(null);
      setMessage(
        result.path
          ? `Игра «${game.title || "Без названия"}» сохранена в файл:\n${result.path}${result.mediaCount ? `\nМедиафайлов: ${result.mediaCount}.` : ""}`
          : `Игра «${game.title || "Без названия"}» сохранена как ${result.fileName || "файл .svoyaigra"}. ${
              result.fileName ? "Место сохранения выбрано в окне браузера." : "Файл находится в папке загрузок браузера."
            }`
      );
    } catch (error) {
      setSavedGamePath("");
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить игру.");
    }
  }

  async function importGame() {
    try {
      setSavedGamePath("");
      const result = await importGameFile();
      if (result.canceled) return;
      if (!result.ok || !isGameState(result.game)) {
        setMessage(result.message || "Не удалось открыть файл игры.");
        return;
      }
      const existingIds = new Set(games.map((game) => game.id));
      const importedGame = existingIds.has(result.game.id)
        ? { ...result.game, id: id("game"), title: `${result.game.title || "Без названия"} (копия)` }
        : result.game;
      persistGames([importedGame, ...games.filter((game) => game.id !== importedGame.id)]);
      selectGame(importedGame);
      setTab("games");
      setOpenActionsGameId(null);
      setMessage(`Игра «${importedGame.title || "Без названия"}» добавлена.`);
    } catch (error) {
      setSavedGamePath("");
      setMessage(error instanceof Error ? error.message : "Не удалось открыть файл игры.");
    }
  }

  function renderGameActions(game: GameState, compact = false) {
    return (
      <div
        className={
          compact
            ? "grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2"
            : "grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:flex-wrap sm:justify-start md:justify-end"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <Button appearance="secondary" className={compact ? "col-span-2 w-full" : "col-span-2 w-full sm:col-auto sm:w-auto"} type="button" onClick={() => checkGame(game)}>
          Проверить игру
        </Button>
        <Button appearance="primary" className={compact ? "w-full" : "w-full sm:w-auto"} icon={<Play size={18} />} type="button" onClick={() => startGame(game)}>
          К игре
        </Button>
        <Menu
          inline
          hasIcons
          closeOnScroll
          open={openActionsGameId === game.id}
          onOpenChange={(event, data) => {
            event.stopPropagation();
            setOpenActionsGameId(data.open ? game.id : null);
          }}
          positioning={{ position: "below", align: "end", offset: 6, overflowBoundary: "window" }}
        >
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="secondary"
              className="min-w-11"
              icon={<MoreVertical size={18} />}
              type="button"
              aria-label={`Действия игры ${game.title || "Без названия"}`}
              onClick={(event) => event.stopPropagation()}
            />
          </MenuTrigger>
          <MenuPopover className="z-[1000]">
            <MenuList>
              <MenuItem icon={<Download size={18} />} onClick={() => exportGame(game)}>
                Сохранить
              </MenuItem>
              <MenuItem icon={<Pencil size={18} />} onClick={() => openGame(game)}>
                Редактировать
              </MenuItem>
              <MenuItem
                disabled={games.length <= 1}
                icon={<Trash2 size={18} />}
                onClick={() => {
                  const nextGames = games.filter((item) => item.id !== game.id);
                  persistGames(nextGames);
                  setOpenActionsGameId(null);
                  if (activeState.id === game.id && nextGames[0]) selectGame(nextGames[0]);
                }}
              >
                Удалить
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    );
  }

  return (
    <main className="admin-shell p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-6">
            <button className="btn btn-secondary admin-back-button" type="button" aria-label="Назад на главный экран" onClick={() => router.push("/")}>
              <ArrowLeft size={24} />
            </button>
            <div className="min-w-0">
              <div className="admin-context-title">Админка</div>
              <p className="admin-muted">Игры и игроки хранятся отдельно.</p>
            </div>
          </div>
        </header>
        {message ? (
          <div className="panel flex flex-wrap items-center justify-between gap-3 whitespace-pre-line border-amber-300/40 p-4 text-amber-100">
            <span>{message}</span>
            {savedGamePath ? (
              <Button appearance="secondary" icon={<FolderOpen size={18} />} type="button" onClick={() => revealGameFile(savedGamePath)}>
                Показать в папке
              </Button>
            ) : null}
          </div>
        ) : null}
        <TabList selectedValue={tab} onTabSelect={(_, data) => setTab(data.value as "games" | "players")}>
          <Tab value="games">Игры</Tab>
          <Tab value="players">Игроки</Tab>
        </TabList>

        {tab === "players" ? <AdminPlayersForm state={activeState} setState={(next) => updateGame(activeState.id, next)} /> : null}

        {tab === "games" ? (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <h1 className="admin-display">Игры</h1>
                <p className="admin-muted">Клик по строке открывает профиль игры.</p>
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:w-auto lg:flex-wrap lg:justify-end">
                <Button appearance="secondary" className="w-full lg:w-auto" icon={<Upload size={18} />} type="button" onClick={importGame}>
                  Открыть игру
                </Button>
                <Button
                  appearance="secondary"
                  className="w-full lg:w-auto"
                  type="button"
                  onClick={() => {
                    const demo = createDemoState(savedPlayers);
                    persistGames([demo, ...games.filter((game) => game.id !== demo.id)]);
                    selectGame(demo);
                    setTab("games");
                  }}
                >
                  Создать демо игру
                </Button>
                <Button appearance="primary" className="w-full lg:w-auto" icon={<Plus size={18} />} type="button" onClick={() => setDraft({ title: "" })}>
                  Создать игру
                </Button>
              </div>
            </div>
            <div className="space-y-3 md:hidden">
              {draft && !draft.id ? (
                <div className="panel space-y-3 p-3">
                  <Input
                    className="w-full"
                    autoFocus
                    placeholder="Название игры"
                    value={draft.title}
                    onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button appearance="secondary" className="w-full" type="button" onClick={() => setDraft(null)}>
                      Отмена
                    </Button>
                    <Button appearance="primary" className="w-full" type="button" onClick={saveDraft}>
                      Сохранить
                    </Button>
                  </div>
                </div>
              ) : null}
              {games.map((game) => (
                <div
                  className="panel cursor-pointer space-y-3 p-3 transition hover:bg-[var(--colorNeutralBackground3)]"
                  key={`mobile-${game.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openGame(game)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openGame(game);
                    }
                  }}
                >
                  <div className="admin-accent break-words text-lg font-semibold leading-6">{game.title || "Без названия"}</div>
                  {renderGameActions(game, true)}
                </div>
              ))}
            </div>
            <div className="panel hidden overflow-visible p-0 md:block">
              <table className="admin-data-table" aria-label="Игры">
                <thead>
                  <tr>
                    <th className="w-[calc(100%-360px)]">Название</th>
                    <th className="w-[360px] text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {draft && !draft.id ? (
                    <tr className="bg-[var(--colorNeutralBackground3)]">
                      <td>
                        <Input
                          className="w-full"
                          autoFocus
                          placeholder="Название игры"
                          value={draft.title}
                          onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                        />
                      </td>
                      <td>
                        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-start md:justify-end">
                          <Button appearance="secondary" className="w-full sm:w-auto" type="button" onClick={() => setDraft(null)}>
                            Отмена
                          </Button>
                          <Button appearance="primary" className="w-full sm:w-auto" type="button" onClick={saveDraft}>
                            Сохранить
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {games.map((game) => {
                    const isEditing = draft?.id === game.id;
                    return (
                      <tr
                        className={`${
                          isEditing ? "bg-[var(--colorNeutralBackground3)]" : "cursor-pointer transition hover:bg-[var(--colorNeutralBackground3)]"
                        }`}
                        key={game.id}
                        onClick={() => {
                          if (!isEditing) openGame(game);
                        }}
                      >
                        <td>
                          {isEditing ? (
                            <Input
                              className="w-full"
                              autoFocus
                              value={draft.title}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                            />
                          ) : (
                            <div className="admin-accent break-words text-lg font-semibold leading-6">{game.title || "Без названия"}</div>
                          )}
                        </td>
                        <td>
                          <div
                            className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:flex-wrap sm:justify-start md:justify-end"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {isEditing ? (
                              <>
                                <Button appearance="secondary" className="w-full sm:w-auto" type="button" onClick={() => setDraft(null)}>
                                  Отмена
                                </Button>
                                <Button appearance="primary" className="w-full sm:w-auto" type="button" onClick={saveDraft}>
                                  Сохранить
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button appearance="secondary" className="col-span-2 w-full sm:col-auto sm:w-auto" type="button" onClick={() => checkGame(game)}>
                                  Проверить игру
                                </Button>
                                <Button appearance="primary" className="w-full sm:w-auto" icon={<Play size={18} />} type="button" onClick={() => startGame(game)}>
                                  К игре
                                </Button>
                                <Menu
                                  inline
                                  hasIcons
                                  closeOnScroll
                                  open={openActionsGameId === game.id}
                                  onOpenChange={(event, data) => {
                                    event.stopPropagation();
                                    setOpenActionsGameId(data.open ? game.id : null);
                                  }}
                                  positioning={{ position: "below", align: "end", offset: 6, overflowBoundary: "window" }}
                                >
                                  <MenuTrigger disableButtonEnhancement>
                                    <Button
                                      appearance="secondary"
                                      className="min-w-11"
                                      icon={<MoreVertical size={18} />}
                                      type="button"
                                      aria-label={`Действия игры ${game.title || "Без названия"}`}
                                      onClick={(event) => event.stopPropagation()}
                                    />
                                  </MenuTrigger>
                                  <MenuPopover className="z-[1000]">
                                    <MenuList>
                                      <MenuItem icon={<Download size={18} />} onClick={() => exportGame(game)}>
                                        Сохранить
                                      </MenuItem>
                                      <MenuItem icon={<Pencil size={18} />} onClick={() => openGame(game)}>
                                        Редактировать
                                      </MenuItem>
                                      <MenuItem
                                        disabled={games.length <= 1}
                                        icon={<Trash2 size={18} />}
                                        onClick={() => {
                                          const nextGames = games.filter((item) => item.id !== game.id);
                                          persistGames(nextGames);
                                          setOpenActionsGameId(null);
                                          if (activeState.id === game.id && nextGames[0]) selectGame(nextGames[0]);
                                        }}
                                      >
                                        Удалить
                                      </MenuItem>
                                    </MenuList>
                                  </MenuPopover>
                                </Menu>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
