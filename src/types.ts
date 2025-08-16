
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

export enum GameMode {
  UNSCRAMBLE = 'unscramble',
  FILL_IN_ONE = 'fill_in_one',
  FILL_IN_TWO = 'fill_in_two',
  FILL_IN_THREE = 'fill_in_three',
}
