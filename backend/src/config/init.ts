import Redis from 'ioredis';
import redisClient from './redis';
import { v4 as uuidv4 } from 'uuid';



//logger function with the exact timestamp and detailed log level
const log  = (level: string, message: string, details: any = {}, startTime?: number) => {
    const timestamp = new Date().toISOString();
    const duration = startTime ? `${Date.now() - startTime}ms` : undefined;
    const logEntry = `[${timestamp}] [${level}] ${message} ${JSON.stringify({ ...details, duration}, null, 2)}`;

    console.log(logEntry);
    if(level === "ERROR") {
        log("DEBUG", "Error stack trace captured", { stack: new Error().stack }, startTime);
    }
};

//object immutable to simulate, then replace with the one from the database
const initialCards = Object.freeze([
    { id: uuidv4(), name: "hinano", power: 12 },
    { id: uuidv4(), name: "bingbao", power: 2 },
    { id: uuidv4(), name: "beong", power: 7 },
    { id: uuidv4(), name: "sandya", power: 9 },
    { id: uuidv4(), name: "flores", power: 1 },
]);

const generateNPCs = () => ({
    npc1: Object.freeze([
        { id: "npc_card1", name: "cranna", power: 1 },
        { id: "npc_card2", name: "cranna", power: 22 },
        { id: "npc_card3", name: "cranna", power: 5 },
        { id: "npc_card4", name: "cranna", power: 1 },
        { id: "npc_card5", name: "cranna", power: 1 },
    ]),
    npc2: Object.freeze([
        { id: "npc_card6", name: "scorphie", power: 2 },
        { id: "npc_card7", name: "scorphie", power: 2 },
        { id: "npc_card8", name: "scorphie", power: 2 },
        { id: "npc_card9", name: "scorphie", power: 2 },
        { id: "npc_card10", name: "scorphie", power: 2 },
    ]),
    npc3: Object.freeze([
        { id: "npc_card11", name: "krysthe", power: 12 },
        { id: "npc_card12", name: "krysthe", power: 2 },
        { id: "npc_card13", name: "krysthe", power: 7 },
        { id: "npc_card14", name: "krysthe", power: 9 },
        { id: "npc_card15", name: "krysthe", power: 1 },
    ]),
});

//cache for match state
let matchStateCache: { [key: string]: { data: any, timestamp: number } } = {};
const cacheTTL = 1000;
const maxCacheSize = 1000;
const cacheRefreshThreshold = 500;

//retry mechanism
async function withRetry(fn: () => Promise<any>, retries = 3, delay = 100, attempt = 1): Promise<any> {
    const startTime = Date.now();
    try {
        //log("DEBUG", `Starting retry attempt`, { attempt, retries }, startTime);
        const result = await fn();
        //log("DEBUG", `Retry attempt successful`, { attempt, retries }, startTime);
        return result;
    } catch (error: any) {
        if(attempt === retries) {
            log("ERROR", `All retry attempts failed`, { attempt, error: error.message, stack: error.stack }, startTime);
            throw error;
        }
        //log("DEBUG", `Retry attempt failed, waiting to retry`, { attempt, error: error.message, delay }, startTime);
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(fn, retries, delay, attempt + 1);
    }
}

//optimized function
const compareCards = (playerCard: any, opponentCard: any) => {
    const startTime = Date.now();
    if(!playerCard || !opponentCard || typeof playerCard.power !== "number" || typeof opponentCard.power !== "number") {
        log("ERROR", `Invalid card data for comparison`, { playerCard, opponentCard, stack: new Error().stack }, startTime);
        throw new Error("Invalid card data");
    }
    const result = playerCard.power > opponentCard.power ? "win" : "lose";
    log("TRACE", `Card comparison result`, { playerCard, opponentCard, result }, startTime);
    return result;
};


//as its name
async function validateMatchState(matchId: string, requiredStatus: string, checkChallenge: boolean = false, expectedChallenge?: string ) {
    const startTime = Date.now();
    const cacheKey = `cache:macth:${matchId}`;
    let matchData;

    //check cache and refresh if needed
    const cached = matchStateCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
        matchData = { ...cached.data };
        log("DEBUG", `Using cached match state`, { matchId, cacheKey, age: Date.now() - cached.timestamp }, startTime);
    } else {
        //if limit reached, clear the cache
        if(Object.keys(matchStateCache).length >=  maxCacheSize) {
            const oldestKey =  Object.keys(matchStateCache).reduce((a, b) => 
                matchStateCache[a].timestamp < matchStateCache[b].timestamp ? a : b
            );
            delete matchStateCache[oldestKey];
            log("DEBUG", `Cache limit reached, clearing oldest entry`, { removedKey: oldestKey, currentSize: Object.keys(matchStateCache).length - 1 }, startTime);
        }
        //get the new data from redis
        matchData = await withRetry(() => redisClient.hgetall(`match:${matchId}`), 3, 100);
        matchStateCache[cacheKey] = { data: { ...matchData }, timestamp: Date.now() };
        log("DEBUG", `Refreshed match state from Redis`, { matchId, cacheKey, data: matchData }, startTime);
    }

    //check the match state
    if(!matchData || matchData.status !== requiredStatus) {
        log("ERROR", `Invalid match state`, { matchId, requiredStatus, currentStatus: matchData?.status, stack: new Error().stack }, startTime);
        throw new Error(`Invalid match state: expected ${requiredStatus}, got ${matchData?.status}`);
    }

    //check the challenge
    if(checkChallenge && matchData.challenge !== expectedChallenge) {
        log("ERROR", `Invalid match challenge`, { matchId, expectedChallenge, currentChallenge: matchData?.challenge, stack: new Error().stack }, startTime);
        throw new Error(`Invalid match challenge: expected ${expectedChallenge}, got ${matchData?.challenge}`);
    }
    log("DEBUG", `Match state validated`, { matchId, status: matchData.status, challenge: matchData.challenge }, startTime);
    return matchData;
}

//as its name
async function validatePlayerState(playerId: string, matchId: string) {
    const startTime = Date.now();
    const playerKey = `player:${playerId}`;
    const playerData = await withRetry(() => redisClient.hgetall(playerKey), 3, 100);

    const cards = JSON.parse(playerData.cards || "[]");
    const slots = JSON.parse(playerData.slots || "[]");

    if(!playerData || cards.length !== 5 || slots.length !== 5) {
        log("ERROR", `Invalid player state`, { playerKey, cardsLength: cards.length, slotsLength: slots.length, stack: new Error().stack }, startTime);
        throw new Error(`Invalid player state`);
    }
    log("DEBUG", `Player state validated`, { playerId, matchId, cards: cards.map((card: any) => card.id), slots: slots.map((slot: any) => slot.id) }, startTime);
    return playerData;
}

//find the match key of the socketId
async function findMatchKey(redisClient: Redis, socketId: string, pattern = "match:*", count = 100): Promise<string | null>{
    const startTime = Date.now();

    let cursor = "0";

    do {
        const [nextCursor, keys] = await withRetry(() => redisClient.scan(cursor, "MATCH", pattern, "COUNT", count), 3, 100);
        log("TRACE", `Scanning Redis keys`, { cursor, nextCursor, keysLength: keys.length }, startTime);
        for(const key of keys) {
            const matchData = await withRetry(() => redisClient.hgetall(key), 3, 100);
            if(
                (matchData.player1 === socketId || matchData.player2 === socketId) &&
                matchData.status === "playing"
            ) {
                log("DEBUG", `Match key found`, { socketId, matchKey: key, matchData }, startTime);
                return key;
            }
        }
        cursor = nextCursor;
    } while (cursor !== "0");
    
    log("DEBUG", `Match key not found`, { socketId }, startTime);
    return null;
}

//scan active matches
async function scanActiveMatches(redisClient: Redis, count = 100): Promise<string[]> {
    const startTime = Date.now();
    let cursor = "0";
    const matchIds: string[] = [];

    do {
        const [nextCursor, ids] = await withRetry(() => redisClient.sscan("active_matches", cursor, "COUNT", count), 3, 100);
        //log("TRACE", `Scanning active matches`, { cursor, nextCursor, idsLength: ids.length }, startTime);
        matchIds.push(...ids);
        cursor = nextCursor;
    } while (cursor !== "0");
    //log("DEBUG", `Active matches scanned`, { matchIds, count: matchIds.length }, startTime);
    return matchIds;
};

export {
    log,
    initialCards,
    generateNPCs,
    withRetry,
    compareCards,
    validateMatchState,
    validatePlayerState,
    findMatchKey,
    scanActiveMatches,
}



