import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  BattleResult,
  Card,
  GameState,
  MatchInfo,
} from "../../types/types";

const initialState: GameState = {
  matchInfo: null,
  playerCards: [],
  opponentCards: [],
  currentRound: 0,
  timeLeft: 0,
  phase: "",
  battleResults: [],
  opponentDisconnected: false,
  arrangeCount: 0,
  beingChallenged: false,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setMatchInfo: (state, action: PayloadAction<MatchInfo | null>) => {
      state.matchInfo = action.payload;
    },
    setPlayerCards: (state, action: PayloadAction<Card[]>) => {
      state.playerCards = action.payload;
    },
    setOpponentCards: (state, action: PayloadAction<Card[]>) => {
      state.opponentCards = action.payload;
    },
    setCurrentRound: (state, action: PayloadAction<number>) => {
      state.currentRound = action.payload;
    },
    setTimeLeft: (state, action: PayloadAction<number>) => {
      state.timeLeft = action.payload;
    },
    setPhase: (state, action: PayloadAction<"Arrange" | "Challenge" | "">) => {
      state.phase = action.payload;
    },
    addBattleResult: (state, action: PayloadAction<BattleResult>) => {
      state.battleResults.push(action.payload);
    },
    setOpponentDisconnected: (state, action: PayloadAction<boolean>) => {
      state.opponentDisconnected = action.payload;
    },
    setArrangeCount: (state, action: PayloadAction<number>) => {
      state.arrangeCount = action.payload;
    },
    setBeingChallenged: (state, action: PayloadAction<boolean>) => {
      state.beingChallenged = action.payload;
    },
    resetGameState: (state) => {
      state.matchInfo = null;
      state.playerCards = [];
      state.opponentCards = [];
      state.currentRound = 0;
      state.timeLeft = 0;
      state.battleResults = [];
      state.opponentDisconnected = false;
    },
  },
});

export const {
  setMatchInfo,
  setPlayerCards,
  setOpponentCards,
  setCurrentRound,
  setTimeLeft,
  setPhase,
  addBattleResult,
  setOpponentDisconnected,
  setArrangeCount,
  setBeingChallenged,
  resetGameState,
} = gameSlice.actions;
export default gameSlice.reducer;
