import express from 'express';
import { findMatch } from '../controllers/match.controller';



const matchRoutes = express.Router();

matchRoutes.get('/find', findMatch);

export default matchRoutes;