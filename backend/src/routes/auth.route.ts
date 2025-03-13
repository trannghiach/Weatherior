import { Router } from "express";
import { loginHandler, logoutHandler, refreshHandler, registerHandler } from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post('/register', registerHandler);
authRoutes.post('/login', loginHandler);
authRoutes.post('/logout', logoutHandler);
authRoutes.post('/refresh', refreshHandler);


export default authRoutes;