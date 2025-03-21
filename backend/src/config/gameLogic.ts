import { log, withRetry, validateMatchState } from "./init";
import redisClient from "./redis";

export async function startArrangePhase(matchId: string, io: any) {
  try {
    const matchData = await validateMatchState(redisClient, matchId, "playing");

    await redisClient.hmset(
      `match:${matchId}`,
      "phase",
      "arrange",
      "challenger",
      "",
      "challengeResponse",
      ""
    );
    await redisClient.zadd(
      `schedules:${matchId}`,
      (Date.now() + 10 * 1000).toString(),
      JSON.stringify({ matchId, type: "end_arrange" })
    );
    io.to(matchId).emit("arrange_phase_started", {
      matchId,
      round: matchData.round,
      timeLeft: 10,
      phase: "Arrange",
      arrangeCount: 2,
    });
    log("DEBUG", "Arrange phase started", { matchId, round: matchData.round });
  } catch (error: any) {
    log("ERROR", "Error in startArrangePhase", { error: error.message });
    io.to(matchId).emit("error", { message: error.message });
  }
}

export async function endArrangePhase(matchId: string, io: any) {
  try {
    const matchData = await validateMatchState(redisClient, matchId, "playing");
    if (matchData.phase !== "arrange") return;

    await redisClient.hset(`match:${matchId}`, "phase", "challenge");
    await redisClient.zadd(
      `schedules:${matchId}`,
      (Date.now() + 10 * 1000).toString(),
      JSON.stringify({ matchId, type: "end_challenge" })
    );
    log("TRACE", "Arrange phase ended", { matchId, round: matchData.round });
    io.to(matchId).emit("challenge_phase_started", {
      matchId,
      round: matchData.round,
      timeLeft: 10,
      phase: "Challenge",
    });
    log("DEBUG", "Challenge phase started", {
      matchId,
      round: matchData.round,
    });
  } catch (error: any) {
    log("ERROR", "Error in endArrangePhase", { error: error.message });
    io.to(matchId).emit("error", { message: error.message });
  }
}

export async function endChallengePhase(matchId: string, io: any) {
  try {
    const matchData = await validateMatchState(redisClient, matchId, "playing");
    if (matchData.phase !== "challenge") return;

    const challengerId = matchData.challenger;
    const response = matchData.challengeResponse;

    if (!challengerId || response === "refused") {

      //minus 1 disabledTurns for all cards if not 0
      const [player1Cards, player2Cards] = await Promise.all([
        redisClient.hget(`player:${matchId}:${matchData.player1Id}`, "cards"),
        redisClient.hget(`player:${matchId}:${matchData.player2Id}`, "cards"),
      ]);
      if (!player1Cards || !player2Cards)
        throw new Error("Player cards not found");
      const p1Cards = JSON.parse(player1Cards);
      const p2Cards = JSON.parse(player2Cards);

      p1Cards.forEach((card: any) => {
        if (card.disabledTurns > 0) card.disabledTurns--;
      });
      p2Cards.forEach((card: any) => {
        if (card.disabledTurns > 0) card.disabledTurns--;
      });

      await Promise.all([
        redisClient.hset(
          `player:${matchId}:${matchData.player1Id}`,
          "cards",
          JSON.stringify(p1Cards)
        ),
        redisClient.hset(
          `player:${matchId}:${matchData.player2Id}`,
          "cards",
          JSON.stringify(p2Cards)
        ),
      ]);

      io.to(matchId).emit("round_ended", {
        matchId,
        player1Id: matchData.player1Id,
        player2Id: matchData.player2Id,
        round: matchData.round,
        player1Cards: p1Cards,
        player2Cards: p2Cards,
      });
      log("DEBUG", "Round ended, no challenge or refused", {
        matchId,
        round: matchData.round,
      });
      await startArrangePhase(matchId, io);
    } else if (response === "accepted" || !response) {
      io.to(matchId).emit("battle_started", {
        matchId,
        round: matchData.round,
        phase: "Battle",
      });
      log("DEBUG", "Start battle phase", { matchId, round: matchData.round });
      const player1Id = matchData.player1Id;
      const player2Id = matchData.player2Id;
      const [player1Cards, player2Cards] = await Promise.all([
        redisClient.hget(`player:${matchId}:${player1Id}`, "cards"),
        redisClient.hget(`player:${matchId}:${player2Id}`, "cards"),
      ]);
      if (!player1Cards || !player2Cards)
        throw new Error("Player cards not found");
      const p1Cards = JSON.parse(player1Cards);
      const p2Cards = JSON.parse(player2Cards);

      const results = p1Cards.map((card: any, i: number) => ({ 
        slot: i,
        player1Card: card,
        player2Card: p2Cards[i],
        winner:
          card.disabledTurns === 0 && p2Cards[i].disabledTurns === 0
            ? card.power > p2Cards[i].power
              ? player1Id
              : player2Id
            : "skip",
      }));

      p1Cards.map((card: any, i: number) => {
        if (results[i].winner === player1Id) {
          p2Cards[i].disabledTurns = 3;
        } else if (results[i].winner === player2Id) {
          card.disabledTurns = 3;
        }
      });

      await Promise.all([
        redisClient.hset(
          `player:${matchId}:${player1Id}`,
          "cards",
          JSON.stringify(p1Cards)
        ),
        redisClient.hset(
          `player:${matchId}:${player2Id}`,
          "cards",
          JSON.stringify(p2Cards)
        ),
      ]);

      await redisClient.hset(`match:${matchId}`, "phase", "battle");
      const updatedMatchData = await withRetry(
        async () => await redisClient.hgetall(`match:${matchId}`),
        3
      );
      io.to(matchId.toString()).emit("battle_result", { matchId, results });
      log("DEBUG", "Battle result sent, waiting for battle_ended", {
        matchId,
        round: updatedMatchData.round,
        phase: updatedMatchData.phase,
        results: results,
      });
    }
  } catch (error: any) {
    log("ERROR", "Error in endChallengePhase", { error: error.message });
    io.to(matchId).emit("error", { message: error.message });
  }
}

export async function endMatch(matchId: string, io: any, winnerId: string) {
  try {
    const matchData = await validateMatchState(redisClient, matchId, "playing");
    await redisClient.hmset(
      `match:${matchId}`,
      "winner",
      winnerId
    );
    io.to(matchId).emit("match_ended", {
      matchId,
      winnerId,
    });
    log("DEBUG", "Match ended", {
      matchId,
      winnerId,
    });
  } catch (error: any) {
    log("ERROR", "Error in endMatch", {
      error: error.message,
    });
    io.to(matchId).emit("error", {
      message: error.message,
    });
  }
}
