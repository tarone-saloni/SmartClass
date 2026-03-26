import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './app/config/ConnectDB.js';
import { initIO } from './app/services/socketService.js';
import authRoutes from './app/routes/auth.js';
import courseRoutes from './app/routes/courses.js';
import notificationRoutes from './app/routes/notifications.js';
import dashboardRoutes from './app/routes/dashboard.js';
import assignmentRoutes from './app/routes/assignments.js';

const app = express();
const httpServer = createServer(app);

connectDB();

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, credentials: true },
});

initIO(io);

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) socket.join(`user:${userId}`);
  socket.on('disconnect', () => {});
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', dashboardRoutes); // /api/teachers/:id/dashboard  /api/students/:id/dashboard
app.use('/api/assignments', assignmentRoutes);

app.get('/', (_req, res) => res.json({ message: 'SmartClass API is running.' }));

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
