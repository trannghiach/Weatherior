import React, { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

interface MatchData {
  matchId: string;
  player1Id: string;
  player2Id: string;
}

interface ErrorData {
  message: string;
}

const SERVER_URL = import.meta.env.VITE_API_URL as string;

const MatchTest: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>("Not connected");
  const [error, setError] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [matchInfo, setMatchInfo] = useState<MatchData | null>(null); // Lưu thông tin trận đấu

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      withCredentials: true,
      auth: {
        token: localStorage.getItem("authToken") || null,
      },
    });

    setSocket(newSocket);

    console.log("Socket initialized, connected:", newSocket.connected);

    newSocket.on("connect", () => {
      console.log("Socket.IO connected with ID:", newSocket.id);
      setStatus("Connected");
      setError("");
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connect error:", err.message);
      setError(`Connection failed: ${err.message}`);
    });

    newSocket.on("connect_timeout", () => {
      console.error("Connection timeout");
      setError("Connection timeout");
    });

    newSocket.on("error", (err) => {
      console.error("General error:", err);
      setError(`Error: ${err}`);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      setStatus("Disconnected");
      setError(`Disconnected: ${reason}`);
      setIsJoining(false);
      setMatchInfo(null); // Reset thông tin trận đấu khi ngắt kết nối
    });

    // Lắng nghe sự kiện match_started từ server
    newSocket.on("match_started", (data: MatchData) => {
      console.log("Match started:", data);
      setMatchInfo(data);
      setStatus("Match joined");
      setIsJoining(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoinMatch = () => {
    if (socket && socket.connected) {
      const playerId = socket.id;
      socket.emit("join_match", { playerId });
      setStatus("Joining match...");
      setError("");
      setIsJoining(true);
    } else {
      setError("Not connected to server");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Matchmaking Test</h1>

        <button
          onClick={handleJoinMatch}
          disabled={isJoining || !socket?.connected}
          className={`w-full py-2 px-4 rounded font-semibold text-white ${
            isJoining || !socket?.connected
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Join Match
        </button>

        <p className="mt-4 text-center font-medium">
          Status: <span className="text-gray-700">{status}</span>
        </p>

        {matchInfo && (
          <div className="mt-4 text-center">
            <p className="text-green-600">Match Joined!</p>
            <p>
              Players: <span className="font-semibold">{matchInfo.player1Id}</span> vs{" "}
              <span className="font-semibold">{matchInfo.player2Id}</span>
            </p>
          </div>
        )}

        {error && (
          <p className="mt-2 text-center text-red-500">Error: {error}</p>
        )}
      </div>
    </div>
  );
};

export default MatchTest;