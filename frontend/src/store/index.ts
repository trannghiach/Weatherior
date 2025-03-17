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
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
