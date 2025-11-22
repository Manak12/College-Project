import express from "express";
import dotenv from "dotenv";
// import router from "./routes/routes.js";

import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import lectureRoutes from './routes/lectureRoutes.js';

import { connectDB } from "./config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerQuestionSocketHandlers } from "./controller/questionController.js";


dotenv.config(); 

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(cookieParser());   
app.use(express.json());      
app.use(express.urlencoded({ extended: true }));

// Add a test route to check cookies
app.get('/test-cookies', (req, res) => {
  console.log('All cookies:', req.cookies);
  res.json({ 
    cookies: req.cookies,
    hasCookieParser: !!req.cookies 
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/lectures', lectureRoutes);


const PORT = process.env.PORT || 5001;

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// Socket.IO simple event handling template
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});
registerQuestionSocketHandlers(io);


if (process.env.NODE_ENV !== "test") {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log("Server started on PORT:", PORT);
      console.log("Cookie parser enabled");
      console.log("Socket.IO enabled");
    });
  });
}

export { io };
export default app;