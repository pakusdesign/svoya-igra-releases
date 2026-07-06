import { sortPlayers } from "@/lib/game";
import type { GameState } from "@/lib/types";
import { PlayerAvatar } from "./PlayerAvatar";

export function ResultsTable({ state, final = false }: { state: GameState; final?: boolean }) {
  const players = sortPlayers(state);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/15 text-white/70">
            <th className="p-3">Место</th>
            <th className="p-3">Игрок</th>
            <th className="p-3">Баллы</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={player.id} className="border-b border-white/10">
              <td className="p-3 text-2xl font-black text-prize">{index + 1}</td>
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} />
                  <div>
                    <div className="font-bold">{player.name}</div>
                    {final && index === 0 ? <div className="text-sm text-prize">Победитель</div> : null}
                  </div>
                </div>
              </td>
              <td className="p-3 text-2xl font-black">{player.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!players.length ? <div className="panel p-6 text-white/70">Игроки ещё не добавлены.</div> : null}
    </div>
  );
}
