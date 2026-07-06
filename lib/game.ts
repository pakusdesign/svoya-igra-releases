import type { GameRound, GameState, Question, SavedPlayer, ScoreEvent, Theme } from "./types";

export const DEFAULT_PRICES = [100, 200, 300, 400, 500];
export const STORAGE_KEY = "svoya-igra-state-v1";

export function id(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createInitialState(): GameState {
  return {
    id: id("game"),
    title: "Своя игра",
    savedPlayers: [],
    players: [],
    rounds: [],
    scoreEvents: [],
    status: "setup"
  };
}

export function resetGameForStart(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({ ...player, score: 0 })),
    rounds: state.rounds.map((round) => ({
      ...round,
      themes: round.themes.map((theme) => ({
        ...theme,
        questions: theme.questions.map((question) => ({ ...question, isPlayed: false }))
      }))
    })),
    activeRoundId: state.rounds[0]?.id,
    activeQuestionId: undefined,
    scoreEvents: [],
    status: "playing"
  };
}

export function getAvailablePrices(theme: Theme, currentQuestionId?: string): number[] {
  const usedPrices = theme.questions
    .filter((question) => question.id !== currentQuestionId)
    .map((question) => question.price);

  return DEFAULT_PRICES.filter((price) => !usedPrices.includes(price));
}

export function validateGameIssues(state: GameState): string[] {
  const issues: string[] = [];

  if (state.players.length < 1) {
    issues.push("Игроки на игру: добавьте минимум 1 игрока.");
  }
  if (state.players.length > 6) {
    issues.push("Игроки на игру: должно быть не больше 6 игроков.");
  }
  if (!state.rounds.length) {
    issues.push("Раунды: добавьте минимум 1 раунд.");
  }
  for (const round of state.rounds) {
    const roundTitle = `Раунд ${round.index}`;
    if (!round.themes.length) {
      issues.push(`${roundTitle}: добавьте минимум 1 тему.`);
    }
    for (const theme of round.themes) {
      const themeTitle = theme.title.trim() || "Без названия";
      const themePath = `${roundTitle} / Тема «${themeTitle}»`;
      if (!theme.title.trim()) {
        issues.push(`${themePath}: заполните название темы.`);
      }
      if (!theme.questions.length) {
        issues.push(`${themePath}: добавьте вопросы.`);
      }
      const prices = new Set<number>();
      for (const question of theme.questions) {
        if (prices.has(question.price)) {
          issues.push(`${themePath}: стоимость ${question.price} используется больше одного раза.`);
        }
        prices.add(question.price);
        const questionPath = `${themePath} / Вопрос ${question.price}`;
        const hasContent = Boolean(
          question.text?.trim() || question.imageUrl || question.audioUrl || question.videoUrl
        );
        if (!hasContent) {
          issues.push(`${questionPath}: заполните текст вопроса или добавьте медиа.`);
        }

        if (question.answerFormat === "multiple-choice") {
          const options = question.answerOptions ?? [];
          if (options.length < 2) {
            issues.push(`${questionPath}: добавьте минимум 2 варианта ответа.`);
          }
          if (options.some((option) => !option.text.trim())) {
            issues.push(`${questionPath}: заполните текст каждого варианта ответа.`);
          }
          if (!options.some((option) => option.isCorrect && option.text.trim())) {
            issues.push(`${questionPath}: отметьте правильный вариант ответа.`);
          }
        } else {
          const answerType = question.answerType ?? "text";
          const hasAnswerText = Boolean(question.answerText.trim());
          const hasAnswerImage = Boolean(question.answerImageUrl);
          const hasAnswerAudio = Boolean(question.answerAudioUrl);
          const hasAnswerVideo = Boolean(question.answerVideoUrl);

          if (answerType === "text" && !hasAnswerText) {
            issues.push(`${questionPath}: заполните текст правильного ответа.`);
          }
          if (answerType === "image" && !hasAnswerImage) {
            issues.push(`${questionPath}: добавьте изображение правильного ответа.`);
          }
          if (answerType === "audio" && !hasAnswerAudio) {
            issues.push(`${questionPath}: добавьте аудио правильного ответа.`);
          }
          if (answerType === "video" && !hasAnswerVideo) {
            issues.push(`${questionPath}: добавьте видео правильного ответа.`);
          }
          if (answerType === "text-image" && (!hasAnswerText || !hasAnswerImage)) {
            issues.push(`${questionPath}: заполните текст и добавьте изображение правильного ответа.`);
          }
          if (answerType === "text-audio" && (!hasAnswerText || !hasAnswerAudio)) {
            issues.push(`${questionPath}: заполните текст и добавьте аудио правильного ответа.`);
          }
          if (answerType === "text-video" && (!hasAnswerText || !hasAnswerVideo)) {
            issues.push(`${questionPath}: заполните текст и добавьте видео правильного ответа.`);
          }
        }
      }
    }
  }

  return issues;
}

export function validateGameReady(state: GameState): string | null {
  const issues = validateGameIssues(state);
  if (issues.length) {
    return issues.join("\n");
  }
  return null;
}

export function findQuestion(state: GameState, questionId: string) {
  for (const round of state.rounds) {
    for (const theme of round.themes) {
      const question = theme.questions.find((item) => item.id === questionId);
      if (question) {
        return { round, theme, question };
      }
    }
  }
  return null;
}

export function activeRound(state: GameState): GameRound | undefined {
  return state.rounds.find((round) => round.id === state.activeRoundId) ?? state.rounds[0];
}

export function isRoundComplete(round?: GameRound): boolean {
  if (!round) return false;
  const questions = round.themes.flatMap((theme) => theme.questions);
  return questions.length > 0 && questions.every((question) => question.isPlayed);
}

export function sortPlayers(state: GameState) {
  return [...state.players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function playerStats(events: ScoreEvent[], playerId: string) {
  const playerEvents = events.filter((event) => event.playerId === playerId);
  return {
    plus: playerEvents.filter((event) => event.delta > 0).length,
    minus: playerEvents.filter((event) => event.delta < 0).length,
    totalDelta: playerEvents.reduce((sum, event) => sum + event.delta, 0)
  };
}

export function renumberRounds(rounds: GameRound[]): GameRound[] {
  return rounds.map((round, index) => ({ ...round, index: index + 1 }));
}

function demoSavedPlayer(name: string, avatarUrl?: string): SavedPlayer {
  const now = new Date().toISOString();
  return { id: id("saved-player"), name, avatarUrl, createdAt: now, updatedAt: now };
}

function question(price: number, text: string, answerText: string, extra: Partial<Question> = {}): Question {
  return {
    id: id("question"),
    price,
    text,
    answerText,
    answerFormat: "open",
    isPlayed: false,
    ...extra
  };
}

export function createDemoState(existingSavedPlayers: SavedPlayer[] = []): GameState {
  const demoPlayers = [
    demoSavedPlayer("Александр", "https://api.dicebear.com/8.x/initials/svg?seed=Alex"),
    demoSavedPlayer("Мария", "https://api.dicebear.com/8.x/initials/svg?seed=Maria"),
    demoSavedPlayer("Илья")
  ];
  const savedPlayers = [
    ...existingSavedPlayers,
    ...demoPlayers.filter((demoPlayer) => !existingSavedPlayers.some((player) => player.name.trim().toLowerCase() === demoPlayer.name.trim().toLowerCase()))
  ];
  const gamePlayers = demoPlayers.map(
    (demoPlayer) =>
      savedPlayers.find((player) => player.name.trim().toLowerCase() === demoPlayer.name.trim().toLowerCase()) ?? demoPlayer
  );

  const themes: Theme[] = [
    {
      id: id("theme"),
      title: "Музыка",
      questions: [
        question(100, "Какая группа выпустила альбом Abbey Road?", "The Beatles"),
        question(200, "Как называется самый низкий мужской певческий голос?", "Бас"),
        question(300, "Угадайте инструмент на изображении.", "Саксофон", {
          imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1000&q=80"
        }),
        question(400, "Музыкальный фрагмент-заглушка: какой это тип инструмента?", "Струнный", {
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        }),
        question(500, "Кто написал музыку к балету 'Лебединое озеро'?", "Пётр Чайковский", {
          answerFormat: "multiple-choice",
          answerOptions: [
            { id: id("option"), text: "Пётр Чайковский", isCorrect: true },
            { id: id("option"), text: "Сергей Прокофьев", isCorrect: false },
            { id: id("option"), text: "Игорь Стравинский", isCorrect: false }
          ]
        })
      ]
    },
    {
      id: id("theme"),
      title: "Кино",
      questions: [
        question(100, "Какой режиссёр снял фильм 'Титаник' 1997 года?", "Джеймс Кэмерон"),
        question(200, "Как называется изображённый предмет со съёмочной площадки?", "Хлопушка", {
          imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1000&q=80"
        }),
        question(300, "Какая премия считается главной кинонаградой США?", "Оскар"),
        question(400, "Видео-вопрос: какой жанр чаще всего использует трейлеры такого типа?", "Приключения", {
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          videoType: "url"
        }),
        question(500, "В каком городе проходит Каннский кинофестиваль?", "Канны", {
          answerFormat: "multiple-choice",
          answerOptions: [
            { id: id("option"), text: "Канны", isCorrect: true },
            { id: id("option"), text: "Берлин", isCorrect: false },
            { id: id("option"), text: "Венеция", isCorrect: false }
          ]
        })
      ]
    },
    {
      id: id("theme"),
      title: "Спорт",
      questions: [
        question(100, "Сколько игроков одной команды находится на поле в классическом футболе?", "11"),
        question(200, "Какой снаряд изображён?", "Баскетбольный мяч", {
          imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80"
        }),
        question(300, "Сколько колец на олимпийском символе?", "5"),
        question(400, "Как называется главный теннисный турнир на траве?", "Уимблдон"),
        question(500, "В каком виде спорта используют шайбу?", "Хоккей")
      ]
    },
    {
      id: id("theme"),
      title: "Наука",
      questions: [
        question(100, "Какая планета ближе всего к Солнцу?", "Меркурий"),
        question(200, "Какой химический символ у кислорода?", "O"),
        question(300, "Что измеряют в ньютонах?", "Силу"),
        question(400, "Видео-вопрос: как называется процесс перехода жидкости в газ?", "Испарение", {
          videoUrl: "https://www.youtube.com/embed/6VvR8C_kF5E",
          videoType: "url"
        }),
        question(500, "Какая частица имеет отрицательный заряд?", "Электрон", {
          answerFormat: "multiple-choice",
          answerOptions: [
            { id: id("option"), text: "Электрон", isCorrect: true },
            { id: id("option"), text: "Протон", isCorrect: false },
            { id: id("option"), text: "Нейтрон", isCorrect: false }
          ]
        })
      ]
    },
    {
      id: id("theme"),
      title: "География",
      questions: [
        question(100, "Столица Франции?", "Париж"),
        question(200, "Самый большой океан Земли?", "Тихий океан"),
        question(300, "На каком материке находится Египет?", "Африка"),
        question(400, "Аудио-заглушка: какой природный объект чаще всего ассоциируется с шумом прибоя?", "Море", {
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        }),
        question(500, "Какая гора считается самой высокой над уровнем моря?", "Эверест")
      ]
    }
  ];

  return {
    id: id("game"),
    title: "Своя игра",
    savedPlayers,
    players: gamePlayers.map((player) => ({
      id: id("player"),
      savedPlayerId: player.id,
      name: player.name,
      avatarUrl: player.avatarUrl,
      score: 0
    })),
    rounds: [{ id: id("round"), index: 1, themes }],
    activeRoundId: undefined,
    scoreEvents: [],
    status: "setup"
  };
}
