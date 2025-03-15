import Redis from "ioredis";
import { log, withRetry } from "./init";
import schedule from "node-schedule";

const addScheduleScript = `
    local matchKey = KEYS[1]
    local scheduleKey = KEYS[2]
    local matchId = ARGV[1]
    local type = ARGV[2]
    local endTime = tonumber(ARGV[3])
    local challengeState = ARGV[4] or "none"
    local challenger = ARGV[5] or ""
    local currentRound = ARGV[6] or "0"
    local timestamp = ARGV[7]

    local matchStatus = redis.call("HGET", matchKey, "status")
    if matchStatus ~= "playing" then
        return cjson.encode({ success = false, message = "Match is not in playing state", matchId=matchId, status=matchStatus, timestamp=timestamp })
    end

    if type == "round" then
        local challenge = redis.call("HGET", matchKey, "challenge")
        if challenge ~= "none" then
            return cjson.encode({ success = false, message = "Cannot start round while challenge is pending or finished", matchId=matchId, challenge=challenge, timestamp=timestamp })
        end
        redis.call("HMSET", matchKey, "currentRound", currentRound, endTime - 15000, "challenge", "none", "challenger", "", challengeStartTime, 0)
    end
    
    if type == "challenge" then
        local challenge = redis.call("HGET", matchKey, "challenge")
        if challenge ~= "pending" then
            return cjson.encode({ success = false, message = "Cannot set challenge response while challenge is not pending", matchId=matchId, challenge=challenge, timestamp=timestamp })
        end
        redis.call("HMSET", matchKey, "challenge", challengeState, "challenger", challenger, "challengeStartTime", endTime - 10000)
    end

    redis.call("ZADD", scheduleKey, endTime, cjson.encode({ matchId = matchId, type = type }))
    return cjson.encode({ success = true, message = "Schedule added", matchId=matchId, type=type, endTime=endTime, timestamp=timestamp })
`;

const removeScheduleScript = `
    local matchKey = KEYS[1]
    local scheduleKey = KEYS[2]
    local matchId = ARGV[1]
    local type = ARGV[2]
    local timestamp = ARGV[3]

    local matchStatus = redis.call("HGET", matchKey, "status")
    if matchStatus ~= "playing" then
        return cjson.encode({ success = false, message = "Match not in playing state", matchId=matchId, status=matchStatus, timestamp=timestamp })
    end

    local scheduleData = cjson.encode({ matchId = matchId, type = type })
    local removed = redis.call("ZREM", scheduleKey, scheduleData)
    if removed == 0 then
        return cjson.encode({ success = false, message = "Schedule not found", matchId=matchId, type=type, timestamp=timestamp })
    end
    return cjson.encode({ success = true, message = "Schedule removed", matchId=matchId, type=type, timestamp=timestamp })
`;

const updateMatchStateScript = `
    local matchKey = KEYS[1]
    local challenge = ARGV[1]
    local challenger = ARGV[2]
    local challengeStartTime = tonumber(ARGV[3]) or 0
    local timestamp = ARGV[4]

    local matchStatus = redis.call("HGET", matchKey, "status")
    if matchStatus ~= "playing" then
        return cjson.encode({ success = false, message = "Match not in playing state", matchKey=matchKey, status=matchStatus, timestamp=timestamp })
    end

    redis.call("HMSET", matchKey, "challenge", challenge, "challenger", challenger, "challengeStartTime", challengeStartTime)
    return cjson.encode({ success = true, message = "Match state updated", matchKey=matchKey, challenge=challenge, challenger=challenger, challengeStartTime=challengeStartTime, timestamp=timestamp })
`;

const updatePlayerStateScript = `
    local playerKey = KEYS[1]
    local field = ARGV[1]
    local value = ARGV[2]
    local timestamp = ARGV[3]

    local exists = redis.call("EXISTS", playerKey)
    if exists == 0 then
        return cjson.encode({ success = false, message = "Player not found", playerKey=playerKey, timestamp=timestamp })
    end

    redis.call("HSET", playerKey, field, value)
    return cjson.encode({ success = true, message = "Player state updated", playerKey=playerKey, field=field, value=value, timestamp=timestamp })
`;

//register the scripts
const registerLuaScripts = (redisClient: Redis) => {
  const startTime = Date.now();

  log("INFO", `Registering Lua scripts`, { startTime });
  redisClient.defineCommand("addSchedule", {
    numberOfKeys: 2,
    lua: addScheduleScript,
  });
  redisClient.defineCommand("removeSchedule", {
    numberOfKeys: 2,
    lua: removeScheduleScript,
  });
  redisClient.defineCommand("updateMatchState", {
    numberOfKeys: 1,
    lua: updateMatchStateScript,
  });
  redisClient.defineCommand("updatePlayerState", {
    numberOfKeys: 1,
    lua: updatePlayerStateScript,
  });
  log("DEBUG", `Lua scripts registered`, { commandCount: 4 }, startTime);
};

//schedule jobs function
const jobScheduler = (redisClient: Redis, io: any) => {
  const startTime = Date.now();
  //log("INFO", `Initializing jobs scheduler`, { startTime });

  const job = schedule.scheduleJob("*/1 * * * * *", async () => {
    const jobStartTime = Date.now();
    // log(
    //   "DEBUG",
    //   `Scheduler triggered`,
    //   { timestamp: jobStartTime },
    //   jobStartTime
    // );

    const maxProcessPerMatch = 50;
    const maxMatches = 100;
    const matchIds = await withRetry(
      () =>
        import("./init").then(({ scanActiveMatches }) =>
          scanActiveMatches(redisClient, maxMatches)
        ),
      3,
      100
    );
    const processedMatchIds = matchIds.slice(0, maxProcessPerMatch);
    // log(
    //   "TRACE",
    //   `Selected matchIds for processing`,
    //   {
    //     totalMatchIds: matchIds.length,
    //     processedMatchIdsLength: processedMatchIds.length,
    //   },
    //   jobStartTime
    // );

    const allSchedules = await Promise.all(
      processedMatchIds.map(async (matchId: string) => {
        const timeBucket = Math.floor(Date.now() / (1000 * 60)); //to group schedules by minute
        const schedules = await withRetry(
          () =>
            redisClient.zrangebyscore(
              `schedules:${matchId}:${timeBucket}`,
              "-inf",
              Date.now(),
              "LIMIT",
              0,
              maxProcessPerMatch
            ),
          3,
          100
        );
        return { matchId, timeBucket, schedules };
      })
    );
    // log(
    //   "DEBUG",
    //   `Fetched schedules for matches`,
    //   {
    //     totalSchedules: allSchedules.reduce(
    //       (sum, { schedules }) => sum + schedules.length,
    //       0
    //     ),
    //   },
    //   jobStartTime
    // );

    const pipeline = redisClient.pipeline();
    const promises = allSchedules.flatMap(
      ({ matchId, timeBucket, schedules }) => {
        schedules.map(async (scheduleStr: string, index: number) => {
          const scheduleData = JSON.parse(scheduleStr);
          const { type } = scheduleData;
        //   log(
        //     "TRACE",
        //     `Processing schedule ${index + 1} for match`,
        //     { matchId, type, scheduleStr },
        //     jobStartTime
        //   );

          try {
            const validateStartTime = Date.now();
            await withRetry(
              () =>
                import("./init").then(({ validateMatchState }) =>
                  validateMatchState(matchId, "playing")
                ),
              3,
              100
            );
            // log(
            //   "TRACE",
            //   `Match state validated`,
            //   { matchId, duration: `${Date.now() - validateStartTime}ms` },
            //   validateStartTime
            // );

            if (type === "round") {
            //   log(
            //     "DEBUG",
            //     `Executing endRound for schedule`,
            //     { matchId },
            //     jobStartTime
            //   );
              await withRetry(
                () =>
                  import("./gameLogic").then(({ endRound }) =>
                    endRound(matchId, io)
                  ),
                3,
                100
              );
            } else if (type === "challenge") {
            //   log(
            //     "DEBUG",
            //     `Executing startBattle for schedule`,
            //     { matchId },
            //     jobStartTime
            //   );
              await withRetry(
                () =>
                  import("./gameLogic").then(({ startBattle }) =>
                    startBattle(matchId, io, true)
                  ),
                3,
                100
              );
            }

            const removeStartTime = Date.now();
            const result = await withRetry(
              () =>
                (redisClient as any).removeSchedule(
                  `match:${matchId}`,
                  `schedules:${matchId}:${timeBucket}`,
                  matchId,
                  type,
                  Date.now().toString()
                ),
              3,
              100
            );

            const resultObject = JSON.parse(result);
            if (!resultObject.success) {
            //   log(
            //     "ERROR",
            //     `Failed to remove schedule`,
            //     {
            //       matchId,
            //       type,
            //       error: resultObject.error,
            //       stack: new Error().stack,
            //     },
            //     removeStartTime
            //   );
              throw new Error(
                `Failed to remove schedule: ${resultObject.error}`
              );
            }
            // log(
            //   "TRACE",
            //   "Schedule removed",
            //   { matchId, type, result: resultObject },
            //   removeStartTime
            // );
            pipeline.zrem(`schedules:${matchId}:${timeBucket}`, scheduleStr); //add the zrem command to the pipeline
          } catch (error: any) {
            log(
              "ERROR",
              `Failed to process schedule`,
              { matchId, type, error: error.message, stack: error.stack },
              jobStartTime
            );
          }
        });
      }
    );

    await Promise.all(promises); //do all the promises, when they are all done, the pipeline will be executed
    await pipeline.exec(); //execute the pipeline
    //log("DEBUG", `Executed pipeline for schedule cleanup`, { commandCount: pipeline.length }, jobStartTime);

    await Promise.all(
        allSchedules.map(async ({ matchId, timeBucket }) => {
            withRetry(() => 
                redisClient.zremrangebyscore(`schedules:${matchId}:${timeBucket}`, "-inf", Date.now() - 5 * 60 * 1000),
                3,
                100
            );
        })
    );
    //log("TRACE", `Cleaned up old schedules`, { timeRange: "last 5 minutes", matchCount: allSchedules.length }, jobStartTime);

    //log("INFO", `Scheduler completed`, { processedSchedules: allSchedules.reduce((sum, {schedules}) => sum + schedules.length, 0), duration: `${Date.now() - jobStartTime}ms` }, jobStartTime);
  });

  return job;
};


export {
    addScheduleScript,
    removeScheduleScript,
    updateMatchStateScript,
    updatePlayerStateScript,
    registerLuaScripts,
    jobScheduler
}