type CardProps = {
  name: string;
  power: number;
  disabled: boolean;
};

const OpponentCard: React.FC<CardProps> = ({ name, power, disabled }) => {
    //console.log(power);
  const bg = `https://res.cloudinary.com/dksvd7ylw/image/upload/f_auto,q_auto/${name}`;

  if (disabled) {
    return (
      <>
        <div
          className="relative w-60 h-76 flex justify-center items-center opacity-70 scale-95"
        >
          <div
            className={`relative w-47 h-63 border border-gray-800 rounded-4xl shadow-lg shadow-gray-700
                `}
            style={{
              background: `url(${bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="relative w-60 h-76 flex justify-center items-center"
        style={{
          perspective: "1000px",
        }}
      >
        <div
          className={`relative w-47 h-63 border border-gray-800 rounded-4xl shadow-lg shadow-gray-700
                `}
          style={{
            background: `url(${bg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <p className="opacity-0 text-xs">{power}</p>
      </div>
    </>
  );
};

export default OpponentCard;
