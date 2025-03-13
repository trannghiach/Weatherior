import { Router } from "express";
import { getUserHandler } from "../controllers/user.controller";


const userRoutes = Router();

userRoutes.get("/", getUserHandler);

export default userRoutes;