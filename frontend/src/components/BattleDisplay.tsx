import { useSelector } from "react-redux";
import { Card } from "../types/types";
import OpponentCard from "./OpponentCard";
import PlayerCard from "./PlayerCard";
import { AppDispatch, RootState } from "../store";
import { CustomSocket } from "../store/slices/socketSlice";
import { useEffect } from "react";
import { Link } from "react-router-dom";

type BattleDisplayProps = {
  socket: CustomSocket | null;
  dispatch?: AppDispatch;
  playerCards: Card[];
  opponentCards: Card[];
};

const BattleDisplay: React.FC<BattleDisplayProps> = ({
  socket,
  playerCards,
  opponentCards,
}) => {
  const { battleResults, matchInfo, winnerId } = useSelector(
    (state: RootState) => state.game
  );

  const winBooleans: boolean[] = [];
  for (let i = 0; i < battleResults.length; i++) {
    if (battleResults[i].winner === socket?.id) {
      winBooleans.push(true);
    } else {
      winBooleans.push(false);
    }
  }

  useEffect(() => {
    const timeOut = setTimeout(() => {
      socket?.emit("battle_ended", { matchId: matchInfo?.matchId });
    }, 3600);
  
    return () => clearTimeout(timeOut);
  }, [])

  if(winnerId) {
    return (
      <div className="flex flex-col justify-center items-center">
        <p
          className="text-3xl font-bold text-amber-700"
          style={{ fontFamily: "enchantedLand" }}
        >
          {winnerId === socket?.id ? "YOU WIN!" : "YOU LOSE!"}
        </p>
        <Link to="/"
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >Back</Link>
      </div>
    )
  }

  return (
    <>
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
              <OpponentCard key={card.id} name={card.name} power={card.power} disabled={card.disabledTurns > 0} />
            </>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center items-center">
        <p
          className="text-3xl font-bold text-amber-700"
          style={{ fontFamily: "enchantedLand" }}
        >
          YOU
        </p>
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {playerCards.map((card, index) => (
            <PlayerCard
              key={card.id}
              name={card.name}
              power={card.power}
              battleState={winBooleans[index]}
              disabled={card.disabledTurns > 0}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default BattleDisplay;
