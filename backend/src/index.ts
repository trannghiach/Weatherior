import "dotenv/config";
import express from 'express';
import cors from 'cors';
import { PORT, WEB_URL } from "./constants/env";
import connectToPostgres from "./config/postgres";
import connectToMongoDB from "./config/mongo";
import errorHandler from "./middleware/errorHandler";
import authRoutes from "./routes/auth.route";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: WEB_URL,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (_, res) => {
    return res.json({ message: "Hello from Weatherior backend" });
});

app.use("/auth", authRoutes);

app.use(errorHandler);

app.listen(PORT, async () => {
    console.log(`Backend server is running on port ${PORT}`);
    await connectToPostgres();
    await connectToMongoDB();
});