import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./socket/socket.js";
import { connectDB } from "./db/connection1.db.js";

// Route Imports
import userRoute from "./routes/user.route.js";
import messageRoute from "./routes/message.route.js";
import geminiRoute from "./routes/gemini.route.js";
import aiRoutes from "./routes/ai.routes.js";
import { errorMiddleware } from "./middlewares/error.middlware.js";

// 1. Connect Database
connectDB();

// 2. CORS Configuration (More robust for Vercel/Render)
const allowedOrigins = [
  "http://localhost:5173",               // Local development
  "https://gup-shup-rtu-ai-lmkt.vercel.app",  // Your exact Vercel URL
  process.env.CLIENT_URL                 // Fallback to env variable
].filter(Boolean); // Removes null/undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error(`Blocked by CORS: ${origin}`); // Log to Render console
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Required to send cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie","contenttype"],
  })
);

// 3. Pre-flight Handling (Crucial for Vercel/Render)
// This ensures OPTIONS requests are handled before your routes
app.options("*", cors());

// 4. Other Middlewares
app.use(express.json());
app.use(cookieParser());

// 5. Port Configuration
const PORT = process.env.PORT || 5000;

// 6. Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/message", messageRoute);
app.use("/api/v1/gemini", geminiRoute);
app.use("/api/v1/ai", aiRoutes);

// 7. Error Middleware (Should be last)
app.use(errorMiddleware);

// 8. Start Server
server.listen(PORT, () => {
  console.log(`Your server listening at port ${PORT}`);
});