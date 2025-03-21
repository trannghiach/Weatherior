export interface Card {
  id: string;
  name: string;
  power: number;
  disabledTurns: number;
}

export interface Slot {
  cardId: string;
  disabledTurns: number;
}

export interface PlayerState {
  cards: Card[];
  slots: Slot[];
}

export interface MatchInfo {
  matchId: string;
  player1Id: string;
  player2Id: string;
  npcs: { [key: string]: Card[] };
}

export interface BattleResult {
  slot: number;
  winner: string;
  canReplace?: boolean;
}

// export interface GameState {
//   matchInfo: MatchInfo | null;
//   playerState: PlayerState | null;
//   opponentState: PlayerState | null;
//   currentRound: number;
//   timeLeft: number;
//   battleResults: BattleResult[];
//   opponentDisconnected: boolean;
// }

export interface GameState {
  matchInfo: MatchInfo | null;
  playerCards: Card[];
  opponentCards: Card[];
  playerHealth: number;
  opponentHealth: number;
  currentRound: number;
  timeLeft: number;
  phase: "Arrange" | "Challenge" | "Battle" | "";
  battleResults: BattleResult[];
  opponentDisconnected: boolean;
  arrangeCount: number;
  beingChallenged: boolean;
  refuseCount: number;
  winnerId?: string;
}