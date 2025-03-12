import { Router } from "express";
import { getUsersHandler, loginHandler, logoutHandler, refreshHandler, registerHandler } from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post('/register', registerHandler);
authRoutes.post('/login', loginHandler);
authRoutes.post('/logout', logoutHandler);
authRoutes.post('/refresh', refreshHandler);

//debug routes
authRoutes.get('/users', getUsersHandler);

export default authRoutes;