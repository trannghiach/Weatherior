export interface Card {
  id: string;
  name: string;
  power: number;
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
  playerCard: Card;
  opponentCard: Card;
  result: "win" | "lose";
  canReplace: boolean;
}

export interface GameState {
  matchInfo: MatchInfo | null;
  playerState: PlayerState | null;
  opponentState: PlayerState | null;
  currentRound: number;
  timeLeft: number;
  battleResults: BattleResult[];
  opponentDisconnected: boolean;
}