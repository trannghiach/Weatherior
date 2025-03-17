import Redis from "ioredis";
import { log, withRetry } from "./init";
import schedule from "node-schedule";

export function jobScheduler(redisClient: Redis, io: any) {
  log("INFO", "Job scheduler initialized");

  schedule.scheduleJob("*/1 * * * * *", async () => {
    try {
      const matchIds = await withRetry(() => redisClient.smembers("active_matches"));
      for (const matchId of matchIds) {
        // Kiểm tra xem matchId còn tồn tại không
        const matchExists = await redisClient.exists(`match:${matchId}`);
        if (!matchExists) {
          log("TRACE", "Skipping non-existent match", { matchId });
          await redisClient.zremrangebyscore(`schedules:${matchId}`, "-inf", "+inf"); // Dọn dẹp lịch trình lạc
          continue;
        }

        const schedules = await withRetry(() => redisClient.zrangebyscore(`schedules:${matchId}`, "-inf", Date.now()));
        for (const scheduleStr of schedules) {
          const schedule = JSON.parse(scheduleStr);
          if (schedule.type === "end_arrange") {
            await withRetry(() => import("./gameLogic").then(({ endArrangePhase }) => endArrangePhase(matchId, io)));
            await redisClient.zrem(`schedules:${matchId}`, scheduleStr);
          } else if (schedule.type === "end_challenge") {
            await withRetry(() => import("./gameLogic").then(({ endChallengePhase }) => endChallengePhase(matchId, io)));
            await redisClient.zrem(`schedules:${matchId}`, scheduleStr);
            log("TRACE", "Challenge phase ended by scheduler", { matchId });
          }
        }
      }
    } catch (error: any) {
      log("ERROR", "Scheduler error", { error: error.message });
    }
  });
}