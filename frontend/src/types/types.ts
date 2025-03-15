export interface CardType {
    id: string;
    power: number;
  }
  
  export interface Slot {
    cardId: string;
    disabledTurns: number;
  }
  
  export interface PlayerState {
    cards: CardType[];
    slots: Slot[];
  }
  
  export interface MatchInfo {
    matchId: string;
    player1Id: string;
    player2Id: string;
    npcs: { [key: string]: CardType[] };
  }