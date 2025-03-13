import mongoose from "mongoose";


declare global {
    namespace Express {
        interface Request {
            userId: string;
            sessionId: string;
        }
    }
}

export {};