import { Server } from "socket.io";
import { WEB_URL } from "../constants/env";
import redisClient from "./redis";
import { v4 as uuidv4 } from "uuid";
import Redis from "ioredis";
import http from "http";

async function scanActiveMatches(
  redisClient: Redis,
  count = 100
): Promise<string[]> {
  let cursor = "0";
  const matchIds: string[] = [];

  do {
    const [nextCursor, ids] = await redisClient.sscan(
      "active_matches",
      cursor,
      "COUNT",
      count
    );
    matchIds.push(...ids);
    cursor = nextCursor;
  } while (cursor !== "0");

  return matchIds;
}

export default function setUpSocketIO(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: WEB_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("conection_error", (err) => {
    console.error("Connection error:", err.message);
  });

  io.on("error", (err) => {
    console.error("Socket.IO error:", err);
  });

  io.on("connection", (socket) => {
    console.log("A player connected:", socket.id);

    socket.on("join_match", async ({ playerId }) => {
      try {
        playerId = socket.id;

        const matchId = await redisClient.get("waiting_match");

        if (matchId) {
          const matchData = await redisClient.hgetall(`match:${matchId}`);

          if (matchData.status !== "waiting") {
            throw new Error("Match is not in waiting status");
          }

          await redisClient.del("waiting_match");

          await redisClient.hmset(
            `match:${matchId}`,
            "player2Id",
            playerId,
            "status",
            "playing"
          );

          await redisClient.srem("active_matches", matchId);

          socket.join(matchId.toString());

          const updatedMatchData = await redisClient.hgetall(
            `match:${matchId}`
          );

          const matchInfo = {
            matchId,
            player1Id: updatedMatchData.player1Id,
            player2Id: updatedMatchData.player2Id,
          };

          io.to(matchId.toString()).emit("match_started", matchInfo);
          console.log(`Match ${matchId} started`);
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
          await redisClient.sadd("active_matches", newMatchId);
          await redisClient.expire("waiting_match", 60);

          socket.join(newMatchId.toString());
          console.log(`Player ${playerId} is waiting for match ${newMatchId}`);
        }
      } catch (error: any) {
        console.error("Error on join_match:", error.message);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", async () => {
      try {
        console.log("A player disconnected:", socket.id);

        const matchId = await redisClient.get("waiting_match");

        if (matchId) {
          const matchData = await redisClient.hgetall(`match:${matchId}`);

          if (
            matchData.player1Id === socket.id &&
            matchData.status === "waiting"
          ) {
            await redisClient.del(`match:${matchId}`);
            await redisClient.del("waiting_match");
            await redisClient.srem("active_matches", matchId);

            console.log(`Match ${matchId} canceled due to disconnection`);
          }
        } else {
          const matchIds = await scanActiveMatches(redisClient);
          for (const matchId of matchIds) {
            const key = `match:${matchId}`;
            const matchData = await redisClient.hgetall(key);

            if (
              (matchData.player1Id === socket.id ||
                matchData.player2Id === socket.id) &&
              matchData.status === "playing"
            ) {
              io.to(matchId.toString()).emit("opponent_disconnected", {
                matchId,
              });
              await redisClient.del(key);
              await redisClient.srem("active_matches", matchId);

              console.log(
                `Notified and cleaned up be-playing match ${matchId} due to disconnection`
              );
              break;
            }
          }
        }
      } catch (error: any) {
        console.error("Error on disconnect:", error.message);
      }
    });
  });

  return io;
}
