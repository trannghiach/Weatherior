import { Router } from "express";
import { getUsersHandler, loginHandler, logoutHandler, registerHandler } from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post('/register', registerHandler);
authRoutes.post('/login', loginHandler);
authRoutes.post('/logout', logoutHandler);

//debug routes
authRoutes.get('/users', getUsersHandler);

export default authRoutes;