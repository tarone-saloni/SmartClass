import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './app/config/ConnectDB.js';
import { initIO } from './app/services/socketService.js';
import authRoutes from './app/routes/auth.js';
import courseRoutes from './app/routes/courses.js';
import notificationRoutes from './app/routes/notifications.js';
import dashboardRoutes from './app/routes/dashboard.js';
import assignmentRoutes from './app/routes/assignments.js';
import quizRoutes from './app/routes/quizzes.js';
import liveClassRoutes from './app/routes/liveClass.js';
import enrollmentRoutes from './app/routes/enrollments.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);

connectDB();

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, credentials: true },
  // Allow large ICE/SDP messages
  maxHttpBufferSize: 1e7,
});

initIO(io);

// broadcaster map: liveClassId → broadcaster's socketId
// Needed so we can forward viewer offers back to the right teacher socket.
const broadcasters = new Map();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) socket.join(`user:${userId}`);

  // ── Live class room management ────────────────────────────────────────────
  socket.on('join-liveclass', (liveClassId) => {
    if (liveClassId) socket.join(`liveclass:${liveClassId}`);
  });

  socket.on('leave-liveclass', (liveClassId) => {
    if (liveClassId) socket.leave(`liveclass:${liveClassId}`);
  });

  // ── WebRTC signaling ──────────────────────────────────────────────────────
  //
  // Flow:
  //   1. Teacher emits  'broadcaster'  → server registers their socketId
  //   2. Student emits  'viewer'       → server tells teacher "new viewer wants stream"
  //   3. Teacher sends  'offer'        → server forwards to viewer
  //   4. Viewer sends   'answer'       → server forwards to teacher
  //   5. Both sides send 'ice-candidate' → server forwards to the other side
  //
  // Each event carries a `liveClassId` so the server routes correctly even
  // when multiple classes run simultaneously.

  // Teacher announces they are the broadcaster for a live class
  socket.on('broadcaster', ({ liveClassId }) => {
    if (!liveClassId) return;
    broadcasters.set(liveClassId, socket.id);
    socket.join(`liveclass:${liveClassId}`);
    // Tell any students already waiting that the broadcaster is now live
    socket.to(`liveclass:${liveClassId}`).emit('broadcaster-ready', { liveClassId });
  });

  // Student wants to receive the stream
  socket.on('viewer', ({ liveClassId }) => {
    if (!liveClassId) return;
    socket.join(`liveclass:${liveClassId}`);
    const broadcasterSocketId = broadcasters.get(liveClassId);
    if (broadcasterSocketId) {
      // Tell the teacher a new viewer connected (include viewer's socketId so
      // the teacher can send back a targeted offer)
      io.to(broadcasterSocketId).emit('new-viewer', {
        viewerSocketId: socket.id,
        liveClassId,
      });
    }
  });

  // Teacher → viewer: WebRTC offer
  socket.on('offer', ({ to, offer, liveClassId }) => {
    io.to(to).emit('offer', { from: socket.id, offer, liveClassId });
  });

  // Viewer → teacher: WebRTC answer
  socket.on('answer', ({ to, answer, liveClassId }) => {
    io.to(to).emit('answer', { from: socket.id, answer, liveClassId });
  });

  // ICE candidates (both directions) — just forward to the target socket
  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // Teacher stops sharing / ends class
  socket.on('broadcaster-stop', ({ liveClassId }) => {
    if (!liveClassId) return;
    broadcasters.delete(liveClassId);
    socket.to(`liveclass:${liveClassId}`).emit('broadcaster-left', { liveClassId });
  });

  // ── Screen share state notifications ─────────────────────────────────────
  // Teacher tells the room their screen share started/stopped so students can
  // adjust their layout before WebRTC renegotiation completes.
  socket.on('screen-share-started', ({ liveClassId }) => {
    socket.to(`liveclass:${liveClassId}`).emit('screen-share-started', { liveClassId });
  });
  socket.on('screen-share-stopped', ({ liveClassId }) => {
    socket.to(`liveclass:${liveClassId}`).emit('screen-share-stopped', { liveClassId });
  });

  // ── Teacher ends the class → all students are redirected ─────────────────
  socket.on('end-class', ({ liveClassId }) => {
    if (!liveClassId) return;
    broadcasters.delete(liveClassId);
    io.to(`liveclass:${liveClassId}`).emit('class-ended', { liveClassId });
  });

  // ── Raise hand / lower hand ───────────────────────────────────────────────
  socket.on('raise-hand', ({ liveClassId, userId, userName }) => {
    if (!liveClassId) return;
    io.to(`liveclass:${liveClassId}`).emit('hand-raised', { userId, userName });
  });
  socket.on('lower-hand', ({ liveClassId, userId }) => {
    if (!liveClassId) return;
    io.to(`liveclass:${liveClassId}`).emit('hand-lowered', { userId });
  });

  // ── Emoji reactions ───────────────────────────────────────────────────────
  socket.on('send-reaction', ({ liveClassId, emoji, userName }) => {
    if (!liveClassId) return;
    io.to(`liveclass:${liveClassId}`).emit('reaction', { emoji, userName });
  });

  // ── Student mic renegotiation ─────────────────────────────────────────────
  // When a student adds their mic track, their PC fires onnegotiationneeded.
  // They send a new offer to the teacher (who is always the broadcaster).
  socket.on('student-offer', ({ liveClassId, offer }) => {
    const teacherSocketId = broadcasters.get(liveClassId);
    if (teacherSocketId) {
      io.to(teacherSocketId).emit('student-offer', { from: socket.id, offer, liveClassId });
    }
  });
  // Teacher sends answer back to the student
  socket.on('teacher-reanswer', ({ to, answer }) => {
    io.to(to).emit('teacher-reanswer', { answer });
  });

  socket.on('disconnect', () => {
    // If the disconnecting socket was a broadcaster, notify all viewers
    for (const [liveClassId, bSocketId] of broadcasters.entries()) {
      if (bSocketId === socket.id) {
        broadcasters.delete(liveClassId);
        io.to(`liveclass:${liveClassId}`).emit('broadcaster-left', { liveClassId });
        break;
      }
    }
  });
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve recorded videos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', dashboardRoutes); // /api/teachers/:id/dashboard  /api/students/:id/dashboard
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/enrollments', enrollmentRoutes);

app.get('/', (_req, res) => res.json({ message: 'SmartClass API is running.' }));

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
