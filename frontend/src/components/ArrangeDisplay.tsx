import { useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { CustomSocket } from "../store/slices/socketSlice";
import { Card } from "../types/types";
import PlayerCard from "./PlayerCard";
import { setArrangeCount, setPlayerCards } from "../store/slices/gameSlice";
import { useState } from "react";

type ArrangeDisplayProps = {
  socket: CustomSocket | null;
  dispatch: AppDispatch;
  playerCards: Card[];
};

const ArrangeDisplay: React.FC<ArrangeDisplayProps> = ({
  socket,
  dispatch,
  playerCards,
}) => {
  const { arrangeCount, matchInfo } = useSelector(
    (state: RootState) => state.game
  );

  const [selectedCards, setSelectedCards] = useState<number[]>([]);

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
    if (arrangeCount === 0) return;
    if (selectedCards.length === 0) {
      setSelectedCards([id]);
    } else if (selectedCards.length === 1) {
      setSelectedCards([...selectedCards, id]);
    } else return;
  };
  return (
    <>
      <div className="flex flex-col justify-center items-center">
        <p
          className="text-3xl font-bold text-amber-700"
          style={{ fontFamily: "enchantedLand" }}
        >
          Arrange your cards ({arrangeCount} left)
        </p>
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {playerCards.map((card, index) => (
              <PlayerCard
                key={index}
                name={card.name}
                power={card.power}
                id={index}
                handleChosen={handleClick}
                count={selectedCards.length}
              />
          ))}
        </div>
      </div>
    </>
  );
};

export default ArrangeDisplay;
