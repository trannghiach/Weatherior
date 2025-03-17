import { useSelector } from "react-redux"
import { RootState } from "../store";
import Card from "./Card";
// import { useEffect } from "react";
// import { setTimeLeft } from "../store/slices/gameSlice";

const Match = () => {
    //const dispatch = useDispatch();
    const { matchInfo, playerState, opponentState, opponentDisconnected } = useSelector(
        (state: RootState) => state.game
    );

    // const { socket } = useSelector(
    //     (state: RootState) => state.socket
    // )

    // useEffect(() => {   
    //     if(timeLeft <= 0) return;
    //     const timer = setInterval(() => {
    //         dispatch(setTimeLeft(timeLeft - 1));
    //     }, 1000);

    //     return () => {
    //         clearInterval(timer);
    //     }
    // }, [timeLeft, dispatch]);

    // const handleReplaceCard = (slot: number) => {
    //     if(!socket || !matchInfo) return;
    //     socket.emit("replace_card", { matchId: matchInfo.matchId, slot, replace: true });
    // }

  return (
    <>
        <div className="flex flex-col items-center justify-center px-[360px] mt-0.5 rounded-2xl shadow-xs shadow-gray-800">
            <p className="text-xl font-semibold mb-2">Match ID: {matchInfo?.matchId}</p>
            {opponentDisconnected && <p className="text-red-500 font-bold">Your opponent has disconnected</p>}
        </div>
        <div className="flex flex-col justify-center items-center">
            <p className="text-3xl font-bold text-amber-700">Your Opponent</p>
            <div className="flex flex-wrap gap-12 justify-center items-center">
                {opponentState?.cards.map(card => (
                    <>
                        <Card key={card.id} name={card.name} power={card.power} />
                    </>
                ))}
            </div>
        </div>
        <div className="flex flex-col justify-center items-center">
            <p className="text-3xl font-bold text-amber-700">You</p>
            <div className="flex flex-wrap gap-12 justify-center items-center">
                {playerState?.cards.map(card => (
                    <>
                        <Card key={card.id} name={card.name} power={card.power} />
                    </>
                ))}
            </div>
        </div>
    </> 
  )
}

export default Match