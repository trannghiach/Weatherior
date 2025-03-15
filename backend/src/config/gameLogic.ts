import {
  compareCards,
  log,
  validateMatchState,
  validatePlayerState,
  withRetry,
} from "./init";
import redisClient from "./redis";

export async function startRound(matchId: string, io: any) {
  const startTime = Date.now();
  try {
    log("DEBUG", `Starting round`, { matchId }, startTime);
    const matchData = await withRetry(
      () => validateMatchState(matchId, "playing", true, "none"),
      3,
      100
    );
    const currentRound = parseInt(matchData.currentRound || "0") + 1;
    const roundStartTime = Date.now();
    const roundEndTime = roundStartTime + 15 * 1000;
    const timeBucket = Math.floor(roundStartTime / (60 * 1000));

    log(
      "TRACE",
      `Scheduling round`,
      { matchId, currentRound, roundStartTime, roundEndTime, timeBucket },
      startTime
    );
    const result = await withRetry(
      () =>
        (redisClient as any).addSchedule(
          `match:${matchId}`,
          `schedules:${matchId}:${timeBucket}`,
          matchId,
          "round",
          roundEndTime.toString(),
          "none",
          "",
          currentRound.toString(),
          roundStartTime.toString()
        ),
      3,
      100
    );
    const resultObject = JSON.parse(result);
    if (!resultObject.success) {
      log(
        "ERROR",
        `Failed to schedule round`,
        { matchId, error: resultObject.error, stack: new Error().stack },
        startTime
      );
      throw new Error(resultObject.error);
    }
    log(
      "TRACE",
      `Round scheduled successfully`,
      { matchId, currentRound, endTime: roundEndTime, result: resultObject },
      startTime
    );
    io.to(matchId.toString()).emit("round_started", {
      matchId,
      round: currentRound,
      timeLeft: 15,
    });
    log(
      "DEBUG",
      `Emitted round_started event`,
      { matchId, round: currentRound },
      startTime
    );
  } catch (error: any) {
    log(
      "ERROR",
      `Failed to start round`,
      { matchId, error: error.message, stack: error.stack },
      startTime
    );
    io.to(matchId.toString()).emit("error", { message: error.message });
  }
}

export async function endRound(matchId: string, io: any) {
  const startTime = Date.now();
  try {
    log("DEBUG", `Ending current round`, { matchId }, startTime);
    const matchData = await withRetry(
      () => validateMatchState(matchId, "playing"),
      3,
      100
    );

    if (matchData.challenge === "accepted") {
      log(
        "TRACE",
        `Challenge accepted so skip the round due to active challenge`,
        { matchId, challenge: matchData.challenge },
        startTime
      );
      return;
    }

    const player1Id = matchData.player1;
    const player2Id = matchData.player2;

    const [player1Data, player2Data] = await Promise.all([
      withRetry(() => validatePlayerState(player1Id, matchId), 3, 100),
      withRetry(() => validatePlayerState(player2Id, matchId), 3, 100),
    ]);
    log(
      "TRACE",
      "Validated player states",
      {
        player1Id,
        player2Id,
        matchId,
        player1Cards: JSON.parse(player1Data.cards).length,
        player2Cards: JSON.parse(player2Data.cards).length,
      },
      startTime
    );

    const player1NPC = player1Data.selectedNPC;
    const player2NPC = player2Data.selectedNPC;

    const battlePromises = [];
    if (player1NPC) {
      log(
        "DEBUG",
        `Scheduling NPC battle for player1`,
        { matchId, player1Id, npc: player1NPC },
        startTime
      );
      battlePromises.push(
        startBattleWithNPC(matchId, player1Id, player1NPC, io)
      );
    }
    if (player2NPC) {
      log(
        "DEBUG",
        `Scheduling NPC battle for player2`,
        { matchId, player2Id, npc: player2NPC },
        startTime
      );
      battlePromises.push(
        startBattleWithNPC(matchId, player2Id, player2NPC, io)
      );
    }
    await Promise.all(battlePromises);
    log(
      "TRACE",
      `Completed NPC battles`,
      { matchId, battleCount: battlePromises.length },
      startTime
    );

    const pipeline = redisClient.pipeline();
    pipeline.hgetall(`playerId:${matchId}:${player1Id}`);
    pipeline.hgetall(`playerId:${matchId}:${player2Id}`);

    const [[, updatedPlayer1Data], [, updatedPlayer2Data]] = await withRetry(
      () => pipeline.exec(),
      3,
      100
    );
    log(
      "TRACE",
      "Fetached updated player data with pipeline",
      { player1Id, player2Id, matchId, commandCount: pipeline.length },
      startTime
    );

    await startRound(matchId, io);
  } catch (error: any) {
    log(
      "ERROR",
      `Failed to end round`,
      { matchId, error: error.message, stack: error.stack },
      startTime
    );
    io.to(matchId.toString()).emit("error", { message: error.message });
  }
}

export async function startBattleWithNPC(
  matchId: string,
  playerId: string,
  npcId: string,
  io: any
) {
  const startTime = Date.now();
  try {
    log(
      "DEBUG",
      `Starting battle with NPC`,
      { matchId, playerId, npcId },
      startTime
    );
    await withRetry(() => validateMatchState(matchId, "playing"), 3, 100);
    const playerData = await withRetry(
      () => validatePlayerState(playerId, matchId),
      3,
      100
    );
    const npcsData = await withRetry(
      () => redisClient.hgetall(`npc:${matchId}`),
      3,
      100
    );

    const playerCards = JSON.parse(playerData.cards);
    const playerSlots = JSON.parse(playerData.slots);
    const npcCards = JSON.parse(npcsData[npcId]);

    io.to(playerId).emit("battle_started", {
      matchId,
      opponent: npcId,
      opponentCards: npcCards,
    });
    log(
      "TRACE",
      `Emitted battle_started event to player`,
      { playerId, matchId, npcId },
      startTime
    );

    const battleResults = [];
    for (let slot = 0; slot < 5; slot++) {
      const slotStartTime = Date.now();
      if (playerSlots[slot].disabledTurns > 0) {
        log(
          "TRACE",
          `Skipping disabled slot in NPC battle`,
          {
            matchId,
            playerId,
            slot,
            disabledTurns: playerSlots[slot].disabledTurns,
          },
          slotStartTime
        );
        continue;
      }

      const result = compareCards(playerCards[slot], npcCards[slot]);
      if (result === "win") {
        battleResults.push({
          slot,
          result,
          playerCard: playerCards[slot],
          opponentCard: npcCards[slot],
          canReplace: true,
        });
      } else {
        playerSlots[slot].disabledTurns = 3;
        battleResults.push({
          slot,
          result,
          playerCard: playerCards[slot],
          opponentCard: npcCards[slot],
          canReplace: false,
        });
      }
      log(
        "TRACE",
        `Completed slot battle with NPC card`,
        { matchId, playerId, slot, result, playerSlot: playerSlots[slot] },
        slotStartTime
      );
    }

    battleResults.forEach(
      ({ slot, result, playerCard, opponentCard, canReplace }) => {
        io.to(playerId).emit("battle_result", {
          matchId,
          slot,
          playerCard,
          opponentCard,
          result,
          canReplace,
        });
      }
    );
    log(
      "DEBUG",
      `Emitted all NPC battle_result events to player`,
      { playerId, matchId, battleCount: battleResults.length },
      startTime
    );

    await redisClient.hset(
      `playerId:${matchId}:${playerId}`,
      "slots",
      JSON.stringify(playerSlots)
    );
    log(
      "TRACE",
      `Updated player slots after NPC battle`,
      { matchId, playerId, slotCount: playerSlots.length },
      startTime
    );
  } catch (error: any) {
    log(
      "ERROR",
      `Failed to start battle with NPC`,
      { matchId, playerId, npcId, error: error.message, stack: error.stack },
      startTime
    );
    io.to(matchId.toString()).emit("error", { message: error.message });
  }
}

export async function startBattle(
  matchId: string,
  io: any,
  isPvP: boolean = true
) {
  const startTime = Date.now();
  try {
    log("DEBUG", `Starting battle`, { matchId, isPvP }, startTime);
    const matchData = await withRetry(
      () => validateMatchState(matchId, "playing"),
      3,
      100
    );

    const player1Id = matchData.player1;
    const player2Id = matchData.player2;

    const [player1Data, player2Data] = await Promise.all([
      withRetry(() => validatePlayerState(player1Id, matchId), 3, 100),
      withRetry(() => validatePlayerState(player2Id, matchId), 3, 100),
    ]);
    log(
      "TRACE",
      "Validated player states",
      { player1Id, player2Id, matchId },
      startTime
    );

    const player1Cards = JSON.parse(player1Data.cards);
    const player2Cards = JSON.parse(player2Data.cards);
    const player1Slots = JSON.parse(player1Data.slots);
    const player2Slots = JSON.parse(player2Data.slots);

    if (isPvP) {
      io.to(matchId.toString()).emit("battle_started", {
        matchId,
        opponent: "player",
      });
      log(
        "TRACE",
        `Emitted battle_started event to both players`,
        { matchId },
        startTime
      );

      const battleResults = [];
      const pipeline = redisClient.pipeline();
      for (let slot = 0; slot < 5; slot++) {
        const slotStartTime = Date.now();
        if (
          player1Slots[slot].disabledTurns > 0 ||
          player2Slots[slot].disabledTurns > 0
        ) {
          log(
            "TRACE",
            `Skipping disabled slot in PvP battle`,
            {
              matchId,
              slot,
              player1Disabled: player1Slots[slot].disabledTurns,
              player2Disabled: player2Slots[slot].disabledTurns,
            },
            slotStartTime
          );
          continue;
        }

        const result = compareCards(player1Cards[slot], player2Cards[slot]);
        if (result === "win") {
          player2Slots[slot].disabledTurns = 3;
        } else {
          player1Slots[slot].disabledTurns = 3;
        }
        log(
          "TRACE",
          `Completed slot battle in PvP`,
          {
            matchId,
            slot,
            result,
            player1Slot: player1Slots[slot],
            player2Slot: player2Slots[slot],
          },
          slotStartTime
        );

        battleResults.push({
          slot,
          result,
          player1Card: player1Cards[slot],
          player2Card: player2Cards[slot],
        });
      }
      battleResults.forEach(({ slot, result, player1Card, player2Card }) => {
        io.to(player1Id).emit("battle_result", {
          matchId,
          slot,
          playerCard: player1Card,
          opponentCard: player2Card,
          result,
          canReplace: false,
        });
        io.to(player2Id).emit("battle_result", {
          matchId,
          slot,
          playerCard: player2Card,
          opponentCard: player1Card,
          result: result === "win" ? "lose" : "win",
          canReplace: false,
        });
      });
      log(
        "DEBUG",
        `Emitted all PvP battle_result events to both players`,
        { matchId, battleCount: battleResults.length },
        startTime
      );

      pipeline.hset(
        `playerId:${matchId}:${player1Id}`,
        "slots",
        JSON.stringify(player1Slots)
      );
      pipeline.hset(
        `playerId:${matchId}:${player2Id}`,
        "slots",
        JSON.stringify(player2Slots)
      );
      await pipeline.exec();
      log(
        "TRACE",
        "Updated player slots after PvP battle with pipeline",
        { matchId, player1Id, player2Id, commandCount: pipeline.length },
        startTime
      );

      const result = await withRetry(
        () =>
          (redisClient as any).updateMatchState(
            `match:${matchId}`,
            "none",
            "",
            "0",
            Date.now().toString()
          ),
        3,
        100
      );

      const resultObject = JSON.parse(result);
      if (!resultObject.success) {
        log(
          "ERROR",
          `Failed to update match state`,
          { matchId, error: resultObject.error, stack: new Error().stack },
          startTime
        );
        throw new Error(resultObject.error);
      }
      log(
        "TRACE",
        `Match state updated successfully after PvP battle`,
        { matchId, result: resultObject },
        startTime
      );
    }
  } catch (error: any) {
    log(
      "ERROR",
      `Failed to start battle`,
      { matchId, isPvP, error: error.message, stack: error.stack },
      startTime
    );
    io.to(matchId.toString()).emit("error", { message: error.message });
  }
}
