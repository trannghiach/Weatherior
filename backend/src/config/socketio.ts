import { Server } from "socket.io";
import { WEB_URL } from "../constants/env";
import redisClient from "./redis";

export default function setupSocketIO(server: any) {
  const io = new Server(server, {
    cors: {
      origin: WEB_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

    io.on("connection", (socket) => {
        console.log("a user connected to: ", socket.id);

        socket.on("join_match", async ({ playerId }) => {
            // find a waiting match
            const matchId = await redisClient.get("waiting_match");

            if(matchId) {
                // found a match, join it with the other player
                await redisClient.del("waiting_match");
                await redisClient.hset(`match:${matchId}`, "player2Id", playerId, "status", "playing");

                socket.join(matchId);
                io.to(matchId).emit("match_started", { matchId });
                console.log(`Match ${matchId} started!`);
            } else {
                // no match found, create a new match
                const newMatchId = Math.floor(Math.random() * 10000);
                await redisClient.hset(`match:${newMatchId}`, "player1Id", playerId, "status", "waiting");
                await redisClient.set("waiting_match", newMatchId);

                socket.join(newMatchId.toString());
                console.log(`Player ${playerId} is waiting in match ${newMatchId}`);
            }
        })

        socket.on("disconnect", () => {
            console.log("User disconnected from: ", socket.id);
        });
    });

    return io;
};


