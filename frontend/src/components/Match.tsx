import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import PlayerCard from "./PlayerCard";
import OpponentCard from "./OpponentCard";
import { useEffect, useState } from "react";
import {
  setArrangeCount,
  setBeingChallenged,
  setPlayerCards,
  setTimeLeft,
} from "../store/slices/gameSlice";

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
    arrangeCount,
    beingChallenged,
  } = useSelector((state: RootState) => state.game);

  const { socket } = useSelector((state: RootState) => state.socket);

  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [challengeSent, setChallengeSent] = useState(false);

  if (selectedCards.length === 2) {
    dispatch(setArrangeCount(arrangeCount - 1));
    const newPlayerCards = [...playerCards];
    const temp = newPlayerCards[selectedCards[0]];
    newPlayerCards[selectedCards[0]] = newPlayerCards[selectedCards[1]];
    newPlayerCards[selectedCards[1]] = temp;
    socket?.emit("arrange_cards", {
      matchId: matchInfo?.matchId,
      cards: newPlayerCards,
    });
    dispatch(setPlayerCards(newPlayerCards));
    setSelectedCards([]);
  }

  const handleClick = (id: number) => {
    if (phase !== "Arrange" || arrangeCount === 0) return;
    if (selectedCards.length === 0) {
      setSelectedCards([id]);
    } else if (selectedCards.length === 1) {
      setSelectedCards([...selectedCards, id]);
    } else return;
  };

  const handleRefuse = () => {
    if (!socket || !matchInfo) return;
    socket.emit("challenge_refused", { matchId: matchInfo.matchId, accept: false });
    dispatch(setBeingChallenged(false));
  };
  const handleChallenge = () => {
    if (!socket || !matchInfo) return;
    socket.emit("send_challenge", { matchId: matchInfo.matchId });
    setChallengeSent(true);
  };

  // const { socket } = useSelector(
  //     (state: RootState) => state.socket
  // )

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      dispatch(setTimeLeft(timeLeft - 1));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [timeLeft, dispatch]);

  // const handleReplaceCard = (slot: number) => {
  //     if(!socket || !matchInfo) return;
  //     socket.emit("replace_card", { matchId: matchInfo.matchId, slot, replace: true });
  // }

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
        <div className="flex flex-col justify-center items-center">
          <p
            className="text-3xl font-bold text-amber-700"
            style={{ fontFamily: "enchantedLand" }}
          >
            OPPONENT
          </p>
          <div className="flex flex-wrap gap-2 justify-center items-center">
            {opponentCards.map((card) => (
              <>
                <OpponentCard
                  key={card.id}
                  name={card.name}
                  power={card.power}
                />
              </>
            ))}
          </div>
        </div>
      )}
      {phase === "Challenge" && (
        <button
          className="bg-amber-700 text-white px-4 py-2 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed"
          onClick={beingChallenged ? handleRefuse : handleChallenge}
          disabled={challengeSent}
        >
          {beingChallenged ? "Refuse" : "Challenge"}
        </button>
      )}
      <div className="flex flex-col justify-center items-center">
        <p
          className="text-3xl font-bold text-amber-700"
          style={{ fontFamily: "enchantedLand" }}
        >
          {phase === "Arrange"
            ? `Arrange your cards (${arrangeCount} left)`
            : "YOU"}
        </p>
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {playerCards.map((card, index) => (
            <>
              <PlayerCard
                key={index}
                name={card.name}
                power={card.power}
                id={index}
                handleChosen={handleClick}
                count={selectedCards.length}
              />
            </>
          ))}
        </div>
      </div>
    </>
  );
};

export default Match;
