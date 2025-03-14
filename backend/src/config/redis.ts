import Redis from "ioredis";
import { REDIS_HOST, REDIS_PORT } from "../constants/env";


const redisClient = new Redis({
    host: REDIS_HOST,
    port: parseInt(REDIS_PORT),
});

export default redisClient;
    