import { useEffect } from "react";
import { RootState } from "../store";
import { useDispatch, useSelector } from "react-redux"
import { io, Socket } from "socket.io-client";
import { setConnected, setSocket } from "../store/slices/socketSlice";
import { addBattleResult, setArrangeCount, setBeingChallenged, setCurrentRound, setMatchInfo, setOpponentCards, setOpponentDisconnected, setPhase, setPlayerCards, setTimeLeft } from "../store/slices/gameSlice";
import Match from "../components/Match";
import { v4 as uuidv4 } from "uuid";

const initialCards = [
  { id: uuidv4(), name: "hinona", power: 12 },
  { id: uuidv4(), name: "bingbao", power: 2 },
  { id: uuidv4(), name: "beong", power: 7 },
  { id: uuidv4(), name: "sandya", power: 9 },
  { id: uuidv4(), name: "flores", power: 1 },
]

const Sandbox: React.FC = () => {
  const dispatch = useDispatch();
  const { isConnected } = useSelector((state: RootState) => state.socket);
  const { matchInfo } = useSelector((state: RootState) => state.game);

  useEffect(() => {
    const newSocket: Socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });
    dispatch(setSocket(newSocket));

    newSocket.on("connect", () => {
      dispatch(setConnected(true));
      console.log("Connected to Socket server");
      newSocket.emit("join_match", { initialCards });
    });

    newSocket.on("match_started", (data: any) => {
      dispatch(setMatchInfo(data.matchInfo));
      dispatch(setPlayerCards(data.playerCards));
      dispatch(setOpponentCards(data.opponentCards));
      dispatch(setCurrentRound(data.currentRound));
    });

    newSocket.on("arrange_phase_started", (data: any) => {
      dispatch(setCurrentRound(data.round));
      dispatch(setTimeLeft(data.timeLeft));
      dispatch(setPhase(data.phase));
      dispatch(setArrangeCount(data.arrangeCount));
    });

    newSocket.on("challenge_phase_started", (data: any) => {
      dispatch(setCurrentRound(data.round));
      dispatch(setTimeLeft(data.timeLeft));
      dispatch(setPhase(data.phase));
    });

    newSocket.on("opponent_arranged", (data: any) => {
      dispatch(setOpponentCards(data.opponentCards));
    });

    newSocket.on("challenge_received", () => {
      dispatch(setBeingChallenged(true));
    });

    newSocket.on("battle_started", (data: any) => {
      dispatch(setPhase(data.phase));
    });

    // newSocket.on("round_ended", (data: { matchId: string, round: number, playerState: Record<string, any> }) => {
    //   const playerId = newSocket.id;
    //   if(!playerId) {
    //     console.log("Player ID not found");
    //     return;
    //   }
    //   dispatch(setPlayerState(data.playerState[playerId]));
    // });

    newSocket.on("battle_result", (data: any) => {
      dispatch(addBattleResult(data));
    });

    newSocket.on("opponent_disconnected", () => {
      dispatch(setOpponentDisconnected(true));
    });

    newSocket.on("error", (error: { message: string }) => {
      console.log("Socket error: ", error.message);
    });

    return () => {
      newSocket.disconnect();
      dispatch(setSocket(null));
      dispatch(setConnected(false));
    }

  }, [dispatch])
  return ( 
    <>
      <div className="flex flex-col justify-center items-center min-h-screen bg-amber-50">
        {isConnected ? (
          matchInfo ? (
            <Match />
          ) : (
            <p>Waiting for an opponent...</p>
          )
        ) : (
          <>
            <p>Connecting to server...</p>
          </>
        )}
      </div>
    </>
  )
}

export default Sandbox