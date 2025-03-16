import { useState } from "react";

type CardProps = {
    name: string;
    imgUrl: string;
};


const Card: React.FC<CardProps> = ({ name, imgUrl }) => {
  const [hover, setHover] = useState(false);

    const bg = `https://res.cloudinary.com/dksvd7ylw/image/upload/f_auto,q_auto/${imgUrl}`;
    const img = `https://res.cloudinary.com/dksvd7ylw/image/upload/f_auto,q_auto/${imgUrl}_rmbg`;
  return (
    <>
      <div
        className="relative w-60 h-76 flex justify-center items-center"
        style={{
          perspective: "1000px",
        }}
      >
        <div
          className={`relative w-47 h-63 border border-gray-800 rounded-4xl shadow-lg shadow-gray-800
                ${hover && "rotate-x-[36deg] shadow-lg shadow-gray-800 opacity-80"}`}
          style={{
            background: `url(${bg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transition:
              "all 0.5s ease-out, box-shadow 0.5s ease-in-out", 
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
          {name}
        </div>
        <img
          src={img}
          alt={name}
          className={`absolute bottom-0 scale-105 transition-all duration-500 ease-out opacity-0
                ${hover && "translate-y-[-63px] scale-125 opacity-100"}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        />
      </div>
    </>
  );
};

export default Card;
