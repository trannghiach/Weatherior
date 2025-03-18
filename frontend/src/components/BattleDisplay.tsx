import { useSelector } from "react-redux";
import { Card } from "../types/types";
import OpponentCard from "./OpponentCard";
import PlayerCard from "./PlayerCard";
import { RootState } from "../store";
import { CustomSocket } from "../store/slices/socketSlice";

type BattleDisplayProps = {
  socket: CustomSocket | null;
  playerCards: Card[];
  opponentCards: Card[];
};

const BattleDisplay: React.FC<BattleDisplayProps> = ({
  socket,
  playerCards,
  opponentCards,
}) => {
  const { battleResults } = useSelector((state: RootState) => state.game);

  if (!socket) return null;
  console.log(battleResults);
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
              <OpponentCard key={card.id} name={card.name} power={card.power} />
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
          {playerCards.map((card) => (
              <PlayerCard key={card.id} name={card.name} power={card.power} />
          ))}
        </div>
      </div>
    </>
  );
};

export default BattleDisplay;
