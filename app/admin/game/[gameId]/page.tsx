import { GameProfileClient } from "./GameProfileClient";

export default async function GameProfilePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return <GameProfileClient gameId={gameId} />;
}
