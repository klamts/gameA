
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Question {
  audioUrl: string;
  answer: string;
}

export interface PlayerProgress {
  playerId: string;
  name: string;
  finishTime: number | null; // in milliseconds
}

export enum GamePhase {
  HOME,
  LOBBY,
  PLAYING,
  LEADERBOARD,
}
