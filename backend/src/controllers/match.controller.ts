import { Request, Response } from "express";
import redisClient from "../config/redis";


export const findMatch = async (req: Request, res: Response) => {
    const matchId = await redisClient.get("waiting_match");

    if (matchId) {
        return res.json({ 
            matchId,
            status: "waiting"
         });
    }

    return res.json({
        message: "No available match found!",
    });
}
