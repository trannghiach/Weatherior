import { Server } from "socket.io";
import http from "http";
import { WEB_URL } from "../constants/env";
import redisClient from "./redis";
import { v4 as uuidv4 } from "uuid";
import { log, withRetry, validateMatchState } from "./init";
import { jobScheduler } from "./scheduler";

async function cleanupRedisOnStartup() {
  try {
    const matchKeys = await redisClient.keys("match:*");
    const playerKeys = await redisClient.keys("player:*");
    const scheduleKeys = await redisClient.keys("schedules:*");
    const activeMatches = await redisClient.smembers("active_matches");

    const pipeline = redisClient.pipeline();
    matchKeys.forEach(key => pipeline.del(key));
    playerKeys.forEach(key => pipeline.del(key));
    scheduleKeys.forEach(key => pipeline.del(key));
    pipeline.del("active_matches");
    pipeline.del("waiting_match");
    await pipeline.exec();

    log("INFO", "Cleaned up Redis on startup", {
      deletedMatches: matchKeys.length,
      deletedPlayers: playerKeys.length,
      deletedSchedules: scheduleKeys.length,
      deletedActiveMatches: activeMatches.length,
    });
  } catch (error: any) {
    log("ERROR", "Failed to clean up Redis on startup", { error: error.message });
  }
}

export default async function setUpSocketIO(server: http.Server) {
  await cleanupRedisOnStartup();

  const io = new Server(server, {
    cors: { origin: WEB_URL, methods: ["GET", "POST"], credentials: true },
  });
  log("INFO", "Socket.IO server initialized");

  io.on("connection", (socket) => {
    log("INFO", "Player connected", { socketId: socket.id });

    socket.on("join_match", async ({ initialCards }) => {
      try {
        if (!Array.isArray(initialCards) || initialCards.length === 0) {
          throw new Error("Invalid initialCards");
        }

        const playerId = socket.id;
        const matchId = await withRetry(() => redisClient.get("waiting_match"));

        if (matchId) {
          const matchData = await validateMatchState(redisClient, matchId, "waiting");
          const player1Id = matchData.player1Id;
          if(!player1Id) throw new Error("Player 1 not found");

          await redisClient.hmset(`match:${matchId}`, "player2Id", playerId, "status", "playing", "round", "1");
          await redisClient.del("waiting_match");
          socket.join(matchId);

          // Lấy cards của player1 từ Redis
          const player1Data = await redisClient.hgetall(`player:${matchId}:${player1Id}`);
          const player1Cards = JSON.parse(player1Data.cards);
          const player2Cards = initialCards;

          await redisClient.hmset(`player:${matchId}:${playerId}`, "cards", JSON.stringify(player2Cards));

          // Gửi thông tin cards cho cả hai người chơi
          io.to(player1Id).emit("match_started", {
            matchInfo: { matchId },
            playerId: player1Id,
            opponentId: playerId,
            currentRound: 1,
            playerCards: player1Cards,
            opponentCards: player2Cards,
          });
          io.to(playerId).emit("match_started", {
            matchInfo: { matchId },
            playerId: playerId,
            opponentId: player1Id,
            currentRound: 1,
            playerCards: player2Cards,
            opponentCards: player1Cards,
          });

          log("INFO", "Match started", { matchId, player1Id, player2Id: playerId });

          await withRetry(() => import("./gameLogic").then(({ startArrangePhase }) => startArrangePhase(matchId, io)));
        } else {
          const newMatchId = uuidv4();
          await redisClient.hmset(`match:${newMatchId}`, "player1Id", playerId, "status", "waiting", "round", "0");
          await redisClient.hmset(`player:${newMatchId}:${playerId}`, "cards", JSON.stringify(initialCards));
          await redisClient.set("waiting_match", newMatchId);
          await redisClient.sadd("active_matches", newMatchId);
          socket.join(newMatchId);
          log("INFO", "New match created", { matchId: newMatchId, playerId });
        }
      } catch (error: any) {
        log("ERROR", "Error in join_match", { error: error.message });
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("arrange_cards", async ({ matchId, cards }) => {
      try {
        await validateMatchState(redisClient, matchId, "playing");
        const playerId = socket.id;
        await redisClient.hmset(`player:${matchId}:${playerId}`, "cards", JSON.stringify(cards));
        const matchData = await redisClient.hgetall(`match:${matchId}`);
        const opponentId = matchData.player1Id === playerId ? matchData.player2Id : matchData.player1Id;
        io.to(opponentId).emit("opponent_arranged", { matchId, opponentCards: cards });
        log("DEBUG", "Cards arranged", { matchId, playerId, cards: cards });
      } catch (error: any) {
        log("ERROR", "Error in arrange_cards", { error: error.message });
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("send_challenge", async ({ matchId }) => {
      try {
        const matchData = await validateMatchState(redisClient, matchId, "playing");
        if (matchData.phase !== "challenge") throw new Error("Not in challenge phase");
        if (matchData.challenger) throw new Error("Challenge already sent");

        const challengerId = socket.id;
        await redisClient.hmset(`match:${matchId}`, "challenger", challengerId);
        const opponentId = matchData.player1Id === challengerId ? matchData.player2Id : matchData.player1Id;
        io.to(opponentId).emit("challenge_received", { matchId, challengerId });
        log("DEBUG", "Challenge sent", { matchId, challengerId });
      } catch (error: any) {
        log("ERROR", "Error in send_challenge", { error: error.message });
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("respond_challenge", async ({ matchId, accept }) => {
      try {
        const matchData = await validateMatchState(redisClient, matchId, "playing");
        if (matchData.phase !== "challenge" || !matchData.challenger) throw new Error("No active challenge");

        const responderId = socket.id;
        const challengerId = matchData.challenger;
        if (responderId === challengerId) throw new Error("Cannot respond to own challenge");

        await redisClient.hmset(`match:${matchId}`, "challengeResponse", accept ? "accepted" : "refused");
        io.to(matchId).emit("challenge_responded", { matchId, accepted: accept });
        log("DEBUG", "Challenge responded", { matchId, responderId, accepted: accept });
      } catch (error: any) {
        log("ERROR", "Error in respond_challenge", { error: error.message });
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("battle_ended", async ({ matchId }) => {
      try {
        const matchData = await validateMatchState(redisClient, matchId, "playing");
        if (matchData.phase !== "battle") throw new Error("Not in battle phase");

        const newRound = (parseInt(matchData.round) + 1).toString();
        await redisClient.hmset(`match:${matchId}`, "round", newRound, "phase", "arrange", "challenger", "", "challengeResponse", "");
        log("DEBUG", "Battle ended, starting new round", { matchId, newRound });
        await withRetry(() => import("./gameLogic").then(({ startArrangePhase }) => startArrangePhase(matchId, io)));
      } catch (error: any) {
        log("ERROR", "Error in battle_ended", { error: error.message });
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", async () => {
      try {
        const matchIds = await withRetry(() => redisClient.smembers("active_matches"));
        for (const matchId of matchIds) {
          const matchData = await redisClient.hgetall(`match:${matchId}`);
          if (matchData.player1Id === socket.id || matchData.player2Id === socket.id) {
            const pipeline = redisClient.pipeline();
            pipeline.del(`match:${matchId}`);
            pipeline.del(`player:${matchId}:${matchData.player1Id}`);
            pipeline.del(`player:${matchId}:${matchData.player2Id}`);
            pipeline.del(`schedules:${matchId}`);
            pipeline.srem("active_matches", matchId);
            await pipeline.exec();
            io.to(matchId).emit("opponent_disconnected", { matchId });
            log("INFO", "Match cleaned up due to disconnect", { matchId, socketId: socket.id, cleanedKeys: [`match:${matchId}`, `schedules:${matchId}`] });
            break;
          }
        }
      } catch (error: any) {
        log("ERROR", "Error in disconnect", { error: error.message });
      }
    });
  });

  jobScheduler(redisClient, io);
  return io;
}