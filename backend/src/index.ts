import "dotenv/config";
import express from "express";
import cors from "cors";
import { PORT, WEB_URL } from "./constants/env";
import connectToPostgres from "./config/postgres";
import redisClient from "./config/redis";
import errorHandler from "./middleware/errorHandler";
import authRoutes from "./routes/auth.route";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: WEB_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_, res) => {
  return res.json({ message: "Hello from Weatherior backend" });
});

app.use("/auth", authRoutes);

app.use(errorHandler);

redisClient.on("connect", async () => {
    console.log("Connected to Redis");

    await connectToPostgres();

    app.listen(PORT, () => {
        console.log(`Backend server is running on Port:${PORT}`);
    });
});

redisClient.on("error", (error) => {
    console.log("Failed connecting to Redis: ", error);
    process.exit(1);
});
