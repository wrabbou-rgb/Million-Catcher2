// Tipos compartidos (solo para el cliente TypeScript)
// El servidor usa schema.js directamente

export type GameStatus = "waiting" | "playing" | "finished";
export type PlayerStatus = "active" | "eliminated" | "winner";

export type QuestionOption = {
  id: string;
  letter: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: number;
  order: number;
  type: string;
  text: string;
  maxOptionsToBet: number;
  options: QuestionOption[];
};

export type MoneyDistribution = Record<string, number>;

// WebSocket Event Types (Shared)
export const WS_EVENTS = {
  CREATE_ROOM: "CREATE_ROOM",
  JOIN_ROOM: "JOIN_ROOM",
  START_GAME: "START_GAME",
  UPDATE_BET: "UPDATE_BET",
  CONFIRM_BET: "CONFIRM_BET",
  NEXT_QUESTION: "NEXT_QUESTION",
  SUBMIT_ANSWER: "SUBMIT_ANSWER",
  REVEAL_RESULT: "REVEAL_RESULT",
  ROOM_CREATED: "ROOM_CREATED",
  PLAYER_JOINED: "PLAYER_JOINED",
  GAME_STARTED: "GAME_STARTED",
  STATE_UPDATE: "STATE_UPDATE",
  PLAYER_UPDATE: "PLAYER_UPDATE",
  ERROR: "ERROR",
} as const;
