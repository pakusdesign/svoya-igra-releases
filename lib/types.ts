export type SavedPlayer = {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type Player = {
  id: string;
  savedPlayerId?: string;
  name: string;
  avatarUrl?: string;
  score: number;
};

export type AnswerOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  price: number;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  videoType?: "url" | "file";
  answerType?: "text" | "image" | "audio" | "video" | "text-image" | "text-audio" | "text-video";
  answerText: string;
  answerImageUrl?: string;
  answerAudioUrl?: string;
  answerVideoUrl?: string;
  answerVideoType?: "url" | "file";
  answerFormat: "open" | "multiple-choice";
  answerOptions?: AnswerOption[];
  isPlayed: boolean;
};

export type Theme = {
  id: string;
  title: string;
  questions: Question[];
};

export type GameRound = {
  id: string;
  index: number;
  themes: Theme[];
};

export type ScoreEvent = {
  id: string;
  playerId: string;
  questionId: string;
  delta: number;
  createdAt: string;
};

export type GameState = {
  id: string;
  title: string;
  savedPlayers: SavedPlayer[];
  players: Player[];
  rounds: GameRound[];
  activeRoundId?: string;
  activeQuestionId?: string;
  scoreEvents: ScoreEvent[];
  status: "setup" | "playing" | "round-results" | "finished";
};
