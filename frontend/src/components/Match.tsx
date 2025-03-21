import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { useEffect } from "react";
import {
  setTimeLeft,
} from "../store/slices/gameSlice";
import BattleDisplay from "./BattleDisplay";
import ChallengeDisplay from "./ChallengeDisplay";
import ArrangeDisplay from "./ArrangeDisplay";

const Match = () => {
  const dispatch = useDispatch();
  const {
    matchInfo,
    playerCards,
    opponentCards,
    opponentDisconnected,
    timeLeft,
    currentRound,
    phase,
  } = useSelector((state: RootState) => state.game);

  const { socket } = useSelector((state: RootState) => state.socket);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      dispatch(setTimeLeft(timeLeft - 1));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [timeLeft, dispatch]);

  return (
    <>
      <div className="flex flex-col items-center justify-center mx-auto px-2 rounded-2xl shadow-xs shadow-gray-800 mb-6">
        <p className="text-xs font-light text-gray-600">
          Match ID: {matchInfo?.matchId}
        </p>
        <p className="text-xs text-green-600">
          Round: {currentRound} - Phase: {phase}
        </p>
        <p className="text-sm text-yellow-600">Time Left: {timeLeft}</p>
        {opponentDisconnected && (
          <p className="text-red-500 font-bold">
            Your opponent has disconnected
          </p>
        )}
      </div>
      {phase === "Battle" && (
        <BattleDisplay
          socket={socket}
          dispatch={dispatch}
          playerCards={playerCards}
          opponentCards={opponentCards}
        />
      )}
      {phase === "Challenge" && (
        <ChallengeDisplay
          socket={socket}
          dispatch={dispatch}
          playerCards={playerCards}
        />
      )}
      {phase === "Arrange" && (
        <ArrangeDisplay
          socket={socket}
          dispatch={dispatch}
          playerCards={playerCards}
        />
      )}
    </>
  );
};

export default Match;
