import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  BattleResult,
  GameState,
  MatchInfo,
  PlayerState,
} from "../../types/types";

const initialState: GameState = {
  matchInfo: null,
  playerState: null,
  opponentState: null,
  currentRound: 0,
  timeLeft: 0,
  battleResults: [],
  opponentDisconnected: false,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setMatchInfo: (state, action: PayloadAction<MatchInfo | null>) => {
      state.matchInfo = action.payload;
    },
    setPlayerState: (state, action: PayloadAction<PlayerState | null>) => {
      state.playerState = action.payload;
    },
    setOpponentState: (state, action: PayloadAction<PlayerState | null>) => {
      state.opponentState = action.payload;
    },
    setCurrentRound: (state, action: PayloadAction<number>) => {
      state.currentRound = action.payload;
    },
    setTimeLeft: (state, action: PayloadAction<number>) => {
      state.timeLeft = action.payload;
    },
    addBattleResult: (state, action: PayloadAction<BattleResult>) => {
      state.battleResults.push(action.payload);
    },
    setOpponentDisconnected: (state, action: PayloadAction<boolean>) => {
      state.opponentDisconnected = action.payload;
    },
    resetGameState: (state) => {
      state.matchInfo = null;
      state.playerState = null;
      state.opponentState = null;
      state.currentRound = 0;
      state.timeLeft = 0;
      state.battleResults = [];
      state.opponentDisconnected = false;
    },
  },
});

export const {
  setMatchInfo,
  setPlayerState,
  setOpponentState,
  setCurrentRound,
  setTimeLeft,
  addBattleResult,
  setOpponentDisconnected,
  resetGameState,
} = gameSlice.actions;
export default gameSlice.reducer;
