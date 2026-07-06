"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminGamePlayers } from "@/components/AdminGamePlayers";
import { AdminRoundsEditor } from "@/components/AdminRoundsEditor";
import { resetGameForStart, validateGameReady } from "@/lib/game";
import { exportGameFile, revealGameFile } from "@/lib/gameFiles";
import { useGamesLibrary } from "@/lib/useGamesLibrary";
import { Tab, TabList } from "@fluentui/react-components";
import { ArrowLeft, Download, FolderOpen } from "lucide-react";

export function GameProfileClient({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { games, loaded, persistGames, selectGame, updateGame } = useGamesLibrary();
  const [tab, setTab] = useState<"rounds" | "players">("rounds");
  const [message, setMessage] = useState("");
  const [savedGamePath, setSavedGamePath] = useState("");
  const game = useMemo(() => games.find((item) => item.id === gameId), [games, gameId]);

  useEffect(() => {
    if (game) selectGame(game);
  }, [game?.id]);

  if (!loaded) return <main className="admin-shell p-6">Загрузка...</main>;

  if (!game) {
    return (
      <main className="admin-shell grid place-items-center p-6">
        <div className="panel max-w-lg p-6 text-center">
          <p className="mb-4">Игра не найдена.</p>
          <button className="btn btn-primary" type="button" onClick={() => router.push("/admin")}>
            Вернуться в админку
          </button>
        </div>
      </main>
    );
  }

  const currentGame = game;

  function startGame() {
    setSavedGamePath("");
    const error = validateGameReady(currentGame);
    if (error) {
      setMessage(error);
      return;
    }
    const startedGame = resetGameForStart(currentGame);
    persistGames(games.map((item) => (item.id === startedGame.id ? startedGame : item)));
    selectGame(startedGame);
    router.push("/game");
  }

  function checkGame() {
    setSavedGamePath("");
    const error = validateGameReady(currentGame);
    setMessage(error || "Игра готова к запуску.");
  }

  async function exportGame() {
    try {
      const result = await exportGameFile(currentGame);
      if (result.canceled) return;
      if (!result.ok) {
        setSavedGamePath("");
        setMessage(result.message || "Не удалось сохранить игру.");
        return;
      }
      setSavedGamePath(result.path || "");
      setMessage(
        result.path
          ? `Игра сохранена в файл:\n${result.path}${result.mediaCount ? `\nМедиафайлов: ${result.mediaCount}.` : ""}`
          : `Игра сохранена как ${result.fileName || "файл .svoyaigra"}. ${
              result.fileName ? "Место сохранения выбрано в окне браузера." : "Файл находится в папке загрузок браузера."
            }`
      );
    } catch (error) {
      setSavedGamePath("");
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить игру.");
    }
  }

  return (
    <main className="admin-shell p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-[320px] flex-1 items-center gap-6">
            <button className="btn btn-secondary admin-back-button" type="button" aria-label="Назад к списку игр" onClick={() => router.push("/admin")}>
              <ArrowLeft size={24} />
            </button>
            <input
              className="field admin-display admin-game-title-field max-w-xl"
              value={currentGame.title}
              onChange={(event) => updateGame(currentGame.id, { ...currentGame, title: event.target.value })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 self-center">
            <button className="btn btn-secondary admin-header-action" type="button" onClick={checkGame}>
              Проверить игру
            </button>
            <button className="btn btn-secondary admin-header-action" type="button" onClick={exportGame}>
              <Download size={18} />
              Сохранить
            </button>
            <button className="btn btn-primary admin-header-action" type="button" onClick={startGame}>
              К игре
            </button>
          </div>
        </header>
        {message ? (
          <div className="panel flex flex-wrap items-center justify-between gap-3 whitespace-pre-line border-amber-300/40 p-4 text-amber-100">
            <span>{message}</span>
            {savedGamePath ? (
              <button className="btn btn-secondary" type="button" onClick={() => revealGameFile(savedGamePath)}>
                <FolderOpen size={18} />
                Показать в папке
              </button>
            ) : null}
          </div>
        ) : null}

        <TabList
          selectedValue={tab}
          onTabSelect={(_, data) => setTab(data.value as "rounds" | "players")}
        >
          <Tab value="rounds">Раунды</Tab>
          <Tab value="players">Игроки на игру</Tab>
        </TabList>

        {tab === "rounds" ? <AdminRoundsEditor state={currentGame} setState={(next) => updateGame(currentGame.id, next)} themesDefaultCollapsed /> : null}
        {tab === "players" ? <AdminGamePlayers state={currentGame} setState={(next) => updateGame(currentGame.id, next)} /> : null}
      </div>
    </main>
  );
}
