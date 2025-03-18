import { configureStore } from "@reduxjs/toolkit";
import socketReducer from "./slices/socketSlice";
import gameReducer from "./slices/gameSlice";

export const store = configureStore({
  reducer: {
    socket: socketReducer,
    game: gameReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: { warnAfter: 100 },
    }),
    devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
