import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { motion } from "framer-motion";

type CardProps = {
  name: string;
  power: number;
  id?: number;
  handleChosen?: (id: number) => void;
  count?: number;
  battleState?: boolean;
  disabled: boolean;
};

const getUpperCaseName = (name: string) => {
  return name[0].toUpperCase() + name.slice(1);
};

const PlayerCard: React.FC<CardProps> = ({
  name,
  power,
  id,
  handleChosen,
  count,
  battleState,
  disabled,
}) => {
  const [hover, setHover] = useState(false);
  const [chosen, setChosen] = useState(false);
  const { arrangeCount, phase } = useSelector((state: RootState) => state.game);

  //console.log("PlayerCard", name, power, id, handleChosen, count, battleState);

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
  };

  const bg = `https://res.cloudinary.com/dksvd7ylw/image/upload/f_auto,q_auto/${name}`;
  const img = `https://res.cloudinary.com/dksvd7ylw/image/upload/f_auto,q_auto/${name}_rmbg`;

  const generateShakeKeyFrames = () => {
    const keyframes = [0];
    for (let i = 1; i <= 8; i++) {
      keyframes.push(i % 2 === 0 ? 1 : -1);
    }
    keyframes.push(0);
    keyframes.push(0);
    return keyframes;
  };

  const currentAnimation =
    typeof battleState === "undefined"
      ? hover
        ? "hover"
        : "initial"
      : battleState
      ? "win"
      : "lose";

  const transition = {
    duration: 0.5,
    ease: [0, 0, 0.2, 1],
  };

  const cardVariants = {
    initial: {
      rotateX: 0,
      opacity: 1,
      boxShadow: "0px 0px 10px rgba(55, 65, 81, 0.5)",
    },
    hover: {
      rotateX: 36,
      opacity: 0.8,
      boxShadow: "0px 0px 15px rgba(55, 65, 81, 0.7)",
    },
    chosen: { rotateX: 36, opacity: 0.8 },
  };

  const textVariants = {
    initial: { y: 0, scale: 1, opacity: 0 },
    hover: { y: 44, scale: 1.1, opacity: 1 },
    chosen: { y: 44, scale: 1.1, opacity: 1 },
  };

  const imageVariants = {
    initial: {
      y: 0,
      scale: 1.05,
      opacity: 0,
    },
    hover: {
      y: -63,
      scale: 1.25,
      opacity: 1,
    },
    chosen: {
      y: -63,
      scale: 1.25,
      opacity: 1,
    },
    win: {
      rotate: generateShakeKeyFrames(),
      y: Array(9).fill(0).concat(-360).concat(0),
      opacity: Array(10).fill(1).concat(0),
    },
    lose: {
      rotate: generateShakeKeyFrames(),
      y: 0,
      opacity: Array(10).fill(1).concat(0),
    },
  };

  const imgTransition = (isFighting: boolean) => ({
    rotate: isFighting
      ? {
          duration: 1,
          ease: "easeInOut",
          times: Array(11)
            .fill(0)
            .map((_, i) => i / 10),
        } 
      : transition,
    y: isFighting
      ? {
          duration: 1.8,
          ease: "easeOut",
          times: Array(9)
            .fill(0)
            .map((_, i) => i / 11.5)
            .concat(0.88)
            .concat(1),
        } 
      : transition,
    opacity: isFighting
      ? {
          duration: 1.8,
          times: Array(9)
            .fill(0)
            .concat(0.95)
            .concat(1),
        }
      : transition,
  });

  if(disabled) return (
    <div
      className="relative w-60 h-76 flex justify-center items-center opacity-70 scale-95"
    >
      <div
        className="relative w-47 h-63 border border-gray-800 rounded-4xl"
        style={{ background: `url(${bg}) center / cover no-repeat` }}
      />
    </div>
  )

  return (
    <div
      className="relative w-60 h-76 flex justify-center items-center"
      style={{ perspective: "1000px" }}
      onClick={typeof id !== "undefined" ? () => handleClick(id) : undefined}
    >
      {!chosen ? (
        <>
          <motion.div
            className="relative w-47 h-63 border border-gray-800 rounded-4xl"
            style={{ background: `url(${bg}) center / cover no-repeat` }}
            variants={cardVariants}
            initial="initial"
            animate={hover ? "hover" : "initial"}
            transition={transition}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          />
          <motion.div
            className="absolute bottom-[36px] text-3xl font-bold text-amber-700"
            style={{ fontFamily: "EnchantedLand" }}
            variants={textVariants}
            initial="initial"
            animate={hover ? "hover" : "initial"}
            transition={transition}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            {getUpperCaseName(name)} - Power: {power}
          </motion.div>
          <motion.img
            src={img}
            alt={name}
            className="absolute bottom-0"
            variants={imageVariants}
            initial="initial"
            animate={currentAnimation}
            transition={imgTransition(
              currentAnimation === "win" || currentAnimation === "lose"
            )}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          />
        </>
      ) : (
        <>
          <motion.div
            className="relative w-47 h-63 border border-gray-800 rounded-4xl shadow-lg shadow-gray-700"
            style={{ background: `url(${bg}) center / cover no-repeat` }}
            variants={cardVariants}
            initial="chosen"
            animate="chosen"
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
          />
          <motion.div
            className="absolute bottom-[36px] text-3xl font-bold text-amber-700"
            style={{ fontFamily: "EnchantedLand" }}
            variants={textVariants}
            initial="chosen"
            animate="chosen"
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
          >
            {getUpperCaseName(name)} - Power: {power}
          </motion.div>
          <motion.img
            src={img}
            alt={name}
            className="absolute bottom-0"
            variants={imageVariants}
            initial="chosen"
            animate="chosen"
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
          />
        </>
      )}
    </div>
  );
};

export default PlayerCard;
