import { Server } from "socket.io";
import { WEB_URL } from "../constants/env";
import redisClient from "./redis";
import { v4 as uuidv4 } from "uuid";

export default function setupSocketIO(server: any) {
  console.log("Setting up Socket.IO with WEB_URL:", WEB_URL); // Log để kiểm tra WEB_URL

  const io = new Server(server, {
    cors: {
      origin: WEB_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Thêm log để kiểm tra lỗi kết nối từ server
  io.on("connect_error", (error) => {
    console.error("Socket.IO connect error:", error.message);
  });

  io.on("error", (error) => {
    console.error("Socket.IO server error:", error);
  });

  io.on("connection", (socket) => {
    console.log("A user connected to:", socket.id);

    socket.on("join_match", async ({ playerId }) => {
      try {
        playerId = socket.id; // Đảm bảo playerId là socket.id
    
        const matchId = await redisClient.get("waiting_match");
    
        if (matchId) {
          const matchData = await redisClient.hgetall(`match:${matchId}`);
          if (matchData.status !== "waiting") {
            throw new Error("Match is not in waiting state");
          }
    
          await redisClient.del("waiting_match");
          await redisClient.hmset(
            `match:${matchId}`,
            "player2Id",
            playerId,
            "status",
            "playing"
          );
    
          socket.join(matchId.toString());
    
          // Lấy lại thông tin trận đấu sau khi cập nhật
          const updatedMatchData = await redisClient.hgetall(`match:${matchId}`);
          const matchInfo = {
            matchId,
            player1Id: updatedMatchData.player1Id,
            player2Id: updatedMatchData.player2Id,
          };
    
          io.to(matchId.toString()).emit("match_started", matchInfo);
          console.log(`Match ${matchId} started!`);
        } else {
          const newMatchId = uuidv4();
          await redisClient.hmset(
            `match:${newMatchId}`,
            "player1Id",
            playerId,
            "status",
            "waiting"
          );
          await redisClient.set("waiting_match", newMatchId);
    
          socket.join(newMatchId.toString());
          console.log(`Player ${playerId} is waiting in match ${newMatchId}`);
        }
      } catch (error: any) {
        console.error("Error in join_match:", error.message);
        socket.emit("error", { message: "Failed to join match" });
      }
    });

    socket.on("disconnect", async () => {
      try {
        console.log("User disconnected from:", socket.id);
        const matchId = await redisClient.get("waiting_match");
        if (matchId) {
          const matchData = await redisClient.hgetall(`match:${matchId}`);
          if (matchData.player1Id === socket.id && matchData.status === "waiting") {
            await redisClient.del(`match:${matchId}`);
            await redisClient.del("waiting_match");
            console.log(`Cleaned up waiting match ${matchId} due to disconnect`);
          }
        } else {
          const allKeys = await redisClient.keys("match:*");
          for (const key of allKeys) {
            const matchData = await redisClient.hgetall(key);
            if (
              (matchData.player1Id === socket.id || matchData.player2Id === socket.id) &&
              matchData.status === "playing"
            ) {
              const matchId = key.split(":")[1];
              io.to(matchId.toString()).emit("opponent_disconnected", { matchId });
              await redisClient.del(key);
              console.log(`Notified and cleaned up playing match ${matchId}`);
              break;
            }
          }
        }
      } catch (error: any) {
        console.error("Error in disconnect handler:", error.message);
      }
    });
  });

  return io;
}