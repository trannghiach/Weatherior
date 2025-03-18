import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";

type CardProps = {
  name: string;
  power: number;
  id?: number;
  handleChosen?: (id: number) => void;
  count?: number;
};

const getUpperCaseName = (name: string) => {
  return name[0].toUpperCase() + name.slice(1);
};

const PlayerCard: React.FC<CardProps> = ({ name, power, id, handleChosen, count }) => {
  const [hover, setHover] = useState(false);
  const [chosen, setChosen] = useState(false);

  const { arrangeCount, phase } = useSelector((state: RootState) => state.game);

  useEffect(() => {
    if (count === 0) {
      setChosen(false);
    }
  }, [count]);

  const handleClick = (id: number) => {
    if (arrangeCount === 0 || phase !== "Arrange") return;
    setChosen(!chosen);
    if (handleChosen) handleChosen(id);
    setHover(false);
  }

  const bg = `https://res.cloudinary.com/dksvd7ylw/image/upload/f_auto,q_auto/${name}`;
  const img = `https://res.cloudinary.com/dksvd7ylw/image/upload/f_auto,q_auto/${name}_rmbg`;
  return (
    <>
      <div
        className={`relative w-60 h-76 flex justify-center items-center`}
        style={{
          perspective: "1000px",
        }}
        onClick={typeof id !== "undefined" ? () => handleClick(id) : undefined}
      >
        {!chosen ? (
          <>
            <div
              className={`relative w-47 h-63 border border-gray-800 rounded-4xl shadow-lg shadow-gray-700
                    ${hover && "rotate-x-[36deg] shadow-lg opacity-80"}`}
              style={{
                background: `url(${bg}) center / cover no-repeat`,
                transition: "all 0.5s ease-out, box-shadow 0.5s ease-in-out",
              }}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            ></div>
            <div
              className={`absolute bottom-[36px] text-3xl font-bold text-amber-700 transition-all duration-500 ease-out opacity-0
                    ${hover && "translate-y-[44px] scale-110 opacity-100"}`}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                fontFamily: "EnchantedLand",
              }}
            >
              {getUpperCaseName(name)} - Power: {power}
            </div>
            <img
              src={img}
              alt={name}
              className={`absolute bottom-0 scale-105 transition-all duration-500 ease-out opacity-0
                    ${hover && "translate-y-[-63px] scale-125 opacity-100"}`}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            />
          </>
        ) : (
          <>
            <div
              className={`relative w-47 h-63 border border-gray-800 rounded-4xl shadow-lg shadow-gray-700 rotate-x-[36deg] opacity-80`}
              style={{
                background: `url(${bg}) center / cover no-repeat`,
              }}
            ></div>
            <div
              className={`absolute bottom-[36px] text-3xl font-bold text-amber-700 translate-y-[44px] scale-110 opacity-100`}
              style={{
                fontFamily: "EnchantedLand",
              }}
            >
              {getUpperCaseName(name)} - Power: {power}
            </div>
            <img
              src={img}
              alt={name}
              className={`absolute bottom-0 translate-y-[-63px] scale-125 opacity-100 transition-all duration-500 ease-out`}
            />
          </>
        )}
      </div>
    </>
  );
};

export default PlayerCard;
