import Redis from "ioredis";

export const log = (level: string, message: string, details: any = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message} ${JSON.stringify(details, null, 2)}`;
  console.log(logEntry);
  if (level === "ERROR") console.error(new Error().stack);
};

export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 100): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 1) {
      log("ERROR", "All retries failed", { error: error.message });
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay);
  }
}

export async function validateMatchState(redisClient: Redis, matchId: string, expectedStatus: string) {
  const matchData = await withRetry(() => redisClient.hgetall(`match:${matchId}`));
  if (!matchData || matchData.status !== expectedStatus) {
    log("ERROR", "Invalid match state", { matchId, expectedStatus, currentStatus: matchData?.status });
    throw new Error("Invalid match state");
  }
  return matchData;
}