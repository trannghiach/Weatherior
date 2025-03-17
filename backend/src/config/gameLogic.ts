import { log, withRetry, validateMatchState } from "./init";
import redisClient from "./redis";

export async function startArrangePhase(matchId: string, io: any) {
  try {
    const matchData = await validateMatchState(redisClient, matchId, "playing");
    await redisClient.hmset(`match:${matchId}`, "phase", "arrange", "challenger", "", "challengeResponse", "");
    await redisClient.zadd(`schedules:${matchId}`, (Date.now() + 10 * 1000).toString(), JSON.stringify({ matchId, type: "end_arrange" }));
    io.to(matchId).emit("arrange_phase_started", { matchId, round: matchData.round, timeLeft: 10, phase: "Arrange", arrangeCount: 1 });
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
    await redisClient.zadd(`schedules:${matchId}`, (Date.now() + 10 * 1000).toString(), JSON.stringify({ matchId, type: "end_challenge" }));
    log("TRACE", "Arrange phase ended", { matchId, round: matchData.round }); 
    io.to(matchId).emit("challenge_phase_started", { matchId, round: matchData.round, timeLeft: 10, phase: "Challenge" });
    log("DEBUG", "Challenge phase started", { matchId, round: matchData.round });
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
      const newRound = (parseInt(matchData.round) + 1).toString();
      await redisClient.hmset(`match:${matchId}`, "round", newRound, "phase", "arrange", "challenger", "", "challengeResponse", "");
      io.to(matchId).emit("round_ended", { matchId, round: matchData.round });
      log("DEBUG", "Round ended, no challenge or refused", { matchId, round: matchData.round });
      await startArrangePhase(matchId, io);
    } else if (response === "accepted" || !response) {
      io.to(matchId).emit("battle_started", { matchId, round: matchData.round, phase: "Battle" });
      log("DEBUG", "Start battle phase", { matchId, round: matchData.round });
      const player1Id = matchData.player1Id;
      const player2Id = matchData.player2Id;
      const [player1Cards, player2Cards] = await Promise.all([
        redisClient.hget(`player:${matchId}:${player1Id}`, "cards"),
        redisClient.hget(`player:${matchId}:${player2Id}`, "cards"),
      ]);
      if(!player1Cards || !player2Cards) throw new Error("Player cards not found");
      const p1Cards = JSON.parse(player1Cards);
      const p2Cards = JSON.parse(player2Cards);

      const results = p1Cards.map((card: any, i: number) => ({
        slot: i,
        player1Card: card,
        player2Card: p2Cards[i],
        result: card.power > p2Cards[i].power ? "player1" : "player2",
      }));

      await redisClient.hset(`match:${matchId}`, "phase", "battle");
      io.to(player1Id).emit("battle_result", { matchId, results });
      io.to(player2Id).emit("battle_result", { matchId, results: results.map((r: any) => ({ ...r, result: r.result === "player1" ? "player2" : "player1" })) });
      log("DEBUG", "Battle result sent, waiting for battle_ended", { matchId, round: matchData.round, results: results });
    }
  } catch (error: any) {
    log("ERROR", "Error in endChallengePhase", { error: error.message });
    io.to(matchId).emit("error", { message: error.message });
  }
}