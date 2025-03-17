import { Server } from "socket.io";
import { WEB_URL } from "../constants/env";
import redisClient from "./redis";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import { generateNPCs, log, validateMatchState, validatePlayerState, withRetry } from "./init";
import { jobScheduler, registerLuaScripts } from "./scheduler";



export default function setUpSocketIO(server: http.Server) {
  const startTime = Date.now();
  const io = new Server(server, {
    cors: {
      origin: WEB_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  log("INFO", "Socket.IO server is set up", { WEB_URL }, startTime);

  io.on("conection_error", (err) => {
    log("ERROR", "Socket.IO connection error", { error: err.message, stack: new Error().stack });
  });

  io.on("error", (err) => {
    log("ERROR", "Socket.IO server error", { error: err.message, stack: new Error().stack });
  });

  registerLuaScripts(redisClient);

  const scheduler = jobScheduler(redisClient, io);
  //log("DEBUG", "Job scheduler and Lua scripts initialized", { schedulerStatus: "running" }, startTime);

  io.on("connection", (socket) => {
    const socketStartTime = Date.now();
    //log("INFO", "A player connected", { socketId: socket.id }, socketStartTime);

    socket.on("join_match", async ({ playerId, initialCards }) => {
      const eventStartTime = Date.now();
      try {
        playerId = socket.id;
        log("DEBUG", "join_match event received", { playerId }, eventStartTime);

        const matchId = await withRetry(() => redisClient.get("waiting_match"), 3, 100);
        log("TRACE", "Fetched waiting match", { matchId, playerId }, eventStartTime);

        if (matchId) {
          const matchData = await withRetry(() => redisClient.hgetall(`match:${matchId}`), 3, 100);
          if (matchData.status !== "waiting") {
            throw new Error("Match is not in waiting state");
          }

          const pipeline = redisClient.pipeline();

          pipeline.del("waiting_match");
          pipeline.hmset(
            `match:${matchId}`,
            "player2Id",
            playerId,
            "status",
            "playing",
            "currentRound",
            0,
            "roundStartTime",
            0,
            "challenge",
            "none",
            "challenger",
            "",
            "challengeStartTime",
            0
          );
          pipeline.srem("active_matches", matchId);
          await pipeline.exec();
          log("TRACE", "Match state updated with pipeline", { matchId, commandCount: pipeline.length }, eventStartTime);

          socket.join(matchId.toString());
          log("DEBUG", `Player ${playerId} joined match ${matchId}`, { matchId, playerId }, eventStartTime);

          const updatedMatchData = await withRetry(() => redisClient.hgetall(`match:${matchId}`), 3, 100);
          const npcs = generateNPCs();
          const npcPipeline = redisClient.pipeline();

          Object.entries(npcs).forEach(([npcId, npcCards]) => {
            npcPipeline.hmset(`npc:${matchId}`, npcId, JSON.stringify(npcCards));
          });

          await npcPipeline.exec();
          log("TRACE", "NPCs generated and stored", { matchId, npcCount: Object.keys(npcs).length, commandCount: npcPipeline.length }, eventStartTime);

          const initialSlots = initialCards.map((card: any) => ({
            cardId: card.id,
            disabledTurns: 0,
          }));

          const playerPipeline = redisClient.pipeline();
          playerPipeline.hmset(
            `player:${matchId}:${updatedMatchData.player1Id}`,
            "cards",
            JSON.stringify(initialCards),
            "slots",
            JSON.stringify(initialSlots),
            "refuseCount",
            2,
            "selectedNPC",
            "",
          );

          playerPipeline.hmset(
            `player:${matchId}:${playerId}`,
            "cards",
            JSON.stringify(initialCards),
            "slots",
            JSON.stringify(initialSlots),
            "refuseCount",
            2,
            "selectedNPC",
            "",
          );

          await playerPipeline.exec();
          log("TRACE", "Initial cards and slots set for players", { matchId, player1Id: updatedMatchData.player1Id, player2Id: playerId, commandCount: playerPipeline.length }, eventStartTime);

          const player1Data = await withRetry(() => redisClient.hgetall(`player:${matchId}:${updatedMatchData.player1Id}`), 3, 100);

          const player1State = {
            cards: JSON.parse(player1Data.cards),
            slots: JSON.parse(player1Data.slots),
          }

          const player2State = {
            cards: initialCards,
            slots: initialSlots,
          }

          const matchInfo = {
            matchId,
            player1Id: updatedMatchData.player1Id,
            player2Id: updatedMatchData.player2Id,
            npcs,
          };

          //io.to(matchId.toString()).emit("match_started", matchInfo);
          io.to(updatedMatchData.player1Id).emit("match_started", { matchInfo, playerState: player1State, opponentState: player2State });
          io.to(playerId).emit("match_started", { matchInfo, playerState: player2State, opponentState: player1State });
          log("INFOR", "Match started", { matchId, player1Id: updatedMatchData.player1Id, player2Id: playerId }, eventStartTime);

          await withRetry(() => import("./gameLogic").then(({ startRound}) => startRound(matchId, io)), 3, 100);
        } else {
          const newMatchId = uuidv4();
          const pipeline = redisClient.pipeline();
          pipeline.hmset(
            `match:${newMatchId}`,
            "player1Id",
            playerId,
            "status",
            "waiting",
            "currentRound",
            0,
            "roundStartTime",
            0,
            "challenge",
            "none",
            "challenger",
            "",
            "challengeStartTime",
            0
          );
          pipeline.set("waiting_match", newMatchId);
          pipeline.sadd("active_matches", newMatchId);
          pipeline.expire("waiting_match", 60);

          await pipeline.exec();
          log("TRACE", "New match created with pipeline", { newMatchId, playerId, commandCount: pipeline.length }, eventStartTime);

          socket.join(newMatchId.toString());
          log("DEBUG", `Player ${playerId} created match ${newMatchId}`, { newMatchId, playerId }, eventStartTime);
        }
      } catch (error: any) {
        log("ERROR", "Error on join_match", { socketId: socket.id, error: error.message, stack: error.stack }, eventStartTime);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("arrange_cards", async ({ matchId, cards }) => {
      const eventStartTime = Date.now();
      try {
        log("DEBUG", "arrange_cards event received", { matchId, socketId: socket.id, cardsLength: cards.length }, eventStartTime);

        await withRetry(() => validateMatchState(matchId, "playing"), 3, 100);
        await withRetry(() => validatePlayerState(socket.id, matchId), 3, 100); 

        const playerKey = `player:${matchId}:${socket.id}`;
        await redisClient.hset(playerKey, "cards", JSON.stringify(cards));
        log("TRACE", "Cards arranged", { matchId, playerKey, cardsLength: cards.length }, eventStartTime);
        io.to(socket.id).emit("cards_arranged", { matchId, success: true });
      } catch (error: any) {
        log("ERROR", "Error on arrange_cards", { matchId, socketId: socket.id, error: error.message, stack: error.stack }, eventStartTime);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("select_npc", async ({ matchId, npcId }) => {
      const eventStartTime = Date.now();
      try {
        log("DEBUG", "select_npc event received", { matchId, socketId: socket.id, npcId }, eventStartTime);
        await withRetry(() => validateMatchState(matchId, "playing"), 3, 100);
        await withRetry(() => validatePlayerState(socket.id, matchId), 3, 100);

        const playerKey = `player:${matchId}:${socket.id}`;
        const result = await withRetry(() => 
          (redisClient as any).updatePlayerState(playerKey, "selectedNPC", npcId, Date.now().toString(),
          3,
          100
        ))
        const resultObject = JSON.parse(result);
        if(!resultObject.success) {
          throw new Error(resultObject.message);
        }
        log("TRACE", "NPC selected and updated", { matchId, playerKey, npcId, result: resultObject }, eventStartTime);
        io.to(socket.id).emit("npc_selected", { matchId, npcId, success: true });
      } catch (error: any) {
        log("ERROR", "Error on select_npc", { matchId, socketId: socket.id, error: error.message, stack: error.stack }, eventStartTime);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("send_challenge", async ({ matchId }) => {
      const eventStartTime = Date.now();
      try {
        log("DEBUG", "send_challenge event received", { matchId, socketId: socket.id }, eventStartTime);
        const matchData = await withRetry(() => validateMatchState(matchId, "playing", true, "none"), 3, 100);

        const result = await withRetry(() =>
          (redisClient as any).updateMatchState(`match:${matchId}`, "pending", socket.id, Date.now().toString(), Date.now().toString()), 
          3, 
          100,
        );
        const resultObject = JSON.parse(result);
        if(!resultObject.success) {
          throw new Error(resultObject.message);
        }
        log("TRACE", "Challenge sent and updated", { matchId, challenger: socket.id, result: resultObject }, eventStartTime);

        const opponentId = matchData.player1Id === socket.id ? matchData.player2Id : matchData.player1Id;
        const opponentKey = `player:${matchId}:${opponentId}`;
        const opponentData = await withRetry(() => redisClient.hgetall(opponentKey), 3, 100);

        io.to(opponentId).emit("challenge_received", {
          matchId,
          challenger: socket.id,
          refuseCount: parseInt(opponentData.refuseCount || "0"),
         });

      } catch (error: any) {
        log("ERROR", "Error on send_challenge", { matchId, socketId: socket.id, error: error.message, stack: error.stack }, eventStartTime);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("respond_challenge", async ({ matchId, accept }) => {
      const eventStartTime = Date.now();
      try {
        log("DEBUG", "respond_challenge event received", { matchId, socketId: socket.id, accept }, eventStartTime);
        const matchData = await withRetry(() => validateMatchState(matchId, "playing", true, "pending"), 3, 100);
        const playerKey = `player:${matchId}:${socket.id}`;
        const playerData = await withRetry(() => redisClient.hgetall(playerKey), 3, 100);
        const refuseCount = parseInt(playerData.refuseCount || "0");

        if(!accept && refuseCount > 0) {

          const result = await withRetry(() =>
            (redisClient as any).updatePlayerState(playerKey, "refuseCount", (refuseCount - 1).toString(), Date.now().toString(), 
            3,
            100
          ));
          const resultObject = JSON.parse(result);
          if(!resultObject.success) {
            throw new Error(resultObject.message);
          }
          log("TRACE", "Challenge refused and updated", { matchId, playerKey, newRefuseCount: refuseCount - 1, result: resultObject }, eventStartTime);
          io.to(matchId.toString()).emit("challenge_response", {
            matchId,
            accepted: false,
          });
        } else {
          const challengeStartTime = Date.now();
          const challengeEndTime = challengeStartTime + 10 * 1000;
          const timeBucket = Math.floor(challengeStartTime / (60 * 1000)); 

          const result = await withRetry(() =>
            (redisClient as any).addSchedule(
              `match:${matchId}`,
              `schedules:${matchId}:${timeBucket}`,
              matchId,
              "challenge",
              challengeEndTime.toString(),
              "accepted",
              socket.id,
              matchData.currentRound.toString(),
              challengeStartTime.toString()
            ),
            3,
            100
          );
          const resultObject = JSON.parse(result);
          if(!resultObject.success) {
            throw new Error(resultObject.message);
          }
          log("TRACE", "Challenge accepted and scheduled", { matchId, challengeEndTime, timeBucket, result: resultObject }, eventStartTime);
          io.to(matchId.toString()).emit("challenge_response", {
            matchId,
            accepted: true,
            timeLeft: 10,
          });
          const scheduleData = JSON.stringify({ matchId, type: "challenge" });
          await redisClient.zadd("schedules", challengeEndTime, scheduleData);
        }
      } catch (error: any) {
        log("ERROR", "Error on respond_challenge", { matchId, socketId: socket.id, error: error.message, stack: error.stack }, eventStartTime);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("replace_card", async ({ matchId, slot, replace }) => {
      const eventStartTime = Date.now();
      try {
        log("DEBUG", "replace_card event received", { matchId, socketId: socket.id, slot, replace }, eventStartTime);
        await withRetry(() => validateMatchState(matchId, "playing"), 3, 100);
        const playerData = await withRetry(() => validatePlayerState(socket.id, matchId), 3, 100);

        const playerKey = `player:${matchId}:${socket.id}`;
        const slots = JSON.parse(playerData.slots);
        const cards = JSON.parse(playerData.cards);

        if(replace && slots[slot].disabledTurns === 0) {
          const npcCard = { id: `npc_card${slot + 1}`, power: 10 };
          cards[slot] = npcCard;
          slots[slot].cardId = npcCard.id;

          const pipeline = redisClient.pipeline();
          pipeline.hmset(playerKey, "cards", JSON.stringify(cards), "slots", JSON.stringify(slots));
          await pipeline.exec();

          log("TRACE", "Card replaced with pipeline", { matchId, playerKey, slot, newCard: npcCard, commandCount: pipeline.length }, eventStartTime);
        } else {
          log("TRACE", "Card replace skipped", { playerKey, slot, disabledTurns: slots[slot].disabledTurns }, eventStartTime);
        }
        io.to(socket.id).emit("card_replaced", { matchId, slot, success: true });
      } catch (error: any) {
        log("ERROR", "Error on replace_card", { matchId, socketId: socket.id, error: error.message, stack: error.stack }, eventStartTime);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", async () => {
      const eventStartTime = Date.now();
      try {
        log("INFO", "A player disconnected", { socketId: socket.id }, eventStartTime);

        const matchId = await withRetry(() => redisClient.get("waiting_match"), 3, 100);

        if (matchId) {
          const matchData = await withRetry(() => redisClient.hgetall(`match:${matchId}`), 3, 100);
          if (
            matchData.player1Id === socket.id &&
            matchData.status === "waiting"
          ) {

            const pipeline = redisClient.pipeline();
            pipeline.del(`match:${matchId}`);
            pipeline.del("waiting_match");
            pipeline.srem("active_matches", matchId);
            await pipeline.exec();
            log("TRACE", "Match canceled with pipeline", { matchId, commandCount: pipeline.length }, eventStartTime);

            console.log(`Match ${matchId} canceled due to disconnection`);
          }
        } else {
          const matchIds = await withRetry(() => import("./init").then(({ scanActiveMatches }) => scanActiveMatches(redisClient)), 3, 100);
          for (const matchId of matchIds) {
            const key = `match:${matchId}`;
            const matchData = await withRetry(() => redisClient.hgetall(key), 3, 100);
            if (
              (matchData.player1Id === socket.id ||
                matchData.player2Id === socket.id) &&
              matchData.status === "playing"
            ) {
              io.to(matchId.toString()).emit("opponent_disconnected", {
                matchId,
              });

              const pipeline = redisClient.pipeline();
              pipeline.del(key);
              pipeline.srem("active_matches", matchId);

              const timeBuckets = Array.from({ length: 5}, (_, i) => Math.floor((Date.now() - i * 60 * 1000) / (60 * 1000)));
              for (const timeBucket of timeBuckets) {
                const schedules = await withRetry(() => redisClient.zrangebyscore(`schedules:${matchId}:${timeBucket}`, "-inf", "+inf"), 3, 100);
                schedules.forEach((scheduleStr: string) => pipeline.zrem(`schedules:${matchId}:${timeBucket}`, scheduleStr));
              }
              await pipeline.exec();
              log("TRACE", "Cleaned up playing match and its schedules with pipeline", { matchId, socketId: socket.id, timeBuckets, commandCount: pipeline.length }, eventStartTime);
              break;
            }
          }
        }
      } catch (error: any) {
        log("ERROR", "Error on disconnect", { socketId: socket.id, error: error.message, stack: error.stack }, eventStartTime);
      }
    });
  });

  log("INFO", "Socket.IO event listeners are completedly set up", { serverStatus: "running", duration: `${Date.now() - startTime}ms` }, startTime);
  return io;
}
