import "dotenv/config";
import express from "express";
import cors from "cors";
import { PORT, WEB_URL } from "./constants/env";
import connectToPostgres from "./config/postgres";
import redisClient from "./config/redis";
import errorHandler from "./middleware/errorHandler";
import authRoutes from "./routes/auth.route";
import cookieParser from "cookie-parser";
import authenticate from "./middleware/authenticate";
import userRoutes from "./routes/user.route";
import { createServer  } from "http";
import setupSocketIO from "./config/socketio";

const app = express();

const httpServer = createServer(app);

try {
  setupSocketIO(httpServer);
  console.log("Socket.IO setup completed");
} catch (error) {
  console.error("Failed to setup Socket.IO:", error);
  process.exit(1);
}

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

app.use("/user", authenticate, userRoutes);

app.use(errorHandler);

redisClient.on("connect", async () => {
    console.log("Connected to Redis");

    await connectToPostgres();

    httpServer.listen(PORT, () => {
        console.log(`Backend server is running on Port:${PORT}`);
    });
});

redisClient.on("error", (error) => {
    console.log("Failed connecting to Redis: ", error);
    process.exit(1);
});
