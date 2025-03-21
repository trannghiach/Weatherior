import { useSelector } from "react-redux";
import PlayerCard from "./PlayerCard";
import { AppDispatch, RootState } from "../store";
import { Card } from "../types/types";
import { setBeingChallenged } from "../store/slices/gameSlice";
import { CustomSocket } from "../store/slices/socketSlice";
import { useState } from "react";

type ChallengeDisplayProps = {
  socket: CustomSocket | null;
  dispatch: AppDispatch;
  playerCards: Card[];
};

const ChallengeDisplay: React.FC<ChallengeDisplayProps> = ({
  socket,
  dispatch,
  playerCards,
}) => {
  const { beingChallenged, matchInfo } = useSelector(
    (state: RootState) => state.game
  );

  const [challengeSent, setChallengeSent] = useState(false);
  const [refused, setRefused] = useState(false);

  const handleRefuse = () => {
    if (!socket || !matchInfo) return;
    socket.emit("respond_challenge", {
      matchId: matchInfo.matchId,
      accept: false,
    });
    setRefused(true);
    dispatch(setBeingChallenged(false));
  };

  const handleChallenge = () => {
    if (!socket || !matchInfo) return;
    socket.emit("send_challenge", { matchId: matchInfo.matchId });
    setChallengeSent(true);
  };

  return (
    <>
      {beingChallenged && <p className="text-2xl">You are being challenged</p>}
      <button
        className="bg-amber-700 text-white px-4 py-2 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed"
        onClick={beingChallenged ? handleRefuse : handleChallenge}
        disabled={challengeSent || refused}
      >
        {beingChallenged ? "Refuse" : "Challenge"}
      </button>
      {refused && <p className="text-2xl">You cowards refused the challenge</p>}
      <div className="flex flex-col justify-center items-center">
        <p
          className="text-3xl font-bold text-amber-700"
          style={{ fontFamily: "enchantedLand" }}
        >
          YOU
        </p>
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {playerCards.map((card) => (
            <PlayerCard
              key={card.id}
              name={card.name}
              power={card.power}
              disabled={card.disabledTurns > 0}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default ChallengeDisplay;
