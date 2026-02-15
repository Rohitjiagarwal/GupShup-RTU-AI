
import { app, server } from "./socket/socket.js";
import express from "express";
import { connectDB } from "./db/connection1.db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import geminiRoute from "./routes/gemini.route.js";
import aiRoutes from "./routes/ai.routes.js";

connectDB();

app.use(
  cors({
    origin: [process.env.CLIENT_URL],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

// routes
import userRoute from "./routes/user.route.js";
import messageRoute from "./routes/message.route.js";
app.use("/api/v1/user", userRoute);
app.use("/api/v1/message", messageRoute);
app.use("/api/v1/gemini", geminiRoute);
app.use("/api/v1/ai", aiRoutes);

// middlwares
import { errorMiddleware } from "./middlewares/error.middlware.js";
app.use(errorMiddleware);

server.listen(PORT, () => {
  console.log(`your server listening at port ${PORT}`);
});
