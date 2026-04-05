import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import Anthropic from "@anthropic-ai/sdk";
import { initIO } from "./app/services/socketService.js";
import authRoutes from "./app/routes/auth.js";
import courseRoutes from "./app/routes/courses.js";
import notificationRoutes from "./app/routes/notifications.js";
import dashboardRoutes from "./app/routes/dashboard.js";
import assignmentRoutes from "./app/routes/assignments.js";
import quizRoutes from "./app/routes/quizzes.js";
import liveClassRoutes from "./app/routes/liveClass.js";
import enrollmentRoutes from "./app/routes/enrollments.js";
import aiRoutes from "./app/routes/ai.js";
import profileRoutes from "./app/routes/profile.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── App factory ─────────────────────────────────────────────────────────────
// Returns { app, httpServer } without calling listen() so tests can use
// supertest without occupying a port.
export function buildApp() {
  const app = express();
  const httpServer = createServer(app);
  const CORS_ORIGIN = process.env.CORS_ORIGIN;
  // ─── Socket.IO ─────────────────────────────────────────────────────────────
  const io = new Server(httpServer, {
    cors: {
      origin: [CORS_ORIGIN, "https://smart-class-ivory.vercel.app"],
      credentials: true,
    },
    maxHttpBufferSize: 1e7,
  });

  initIO(io);

  // broadcaster map: liveClassId → broadcaster's socketId
  const broadcasters = new Map();

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) socket.join(`user:${userId}`);

    // ── Course room management ──────────────────────────────────────────────
    socket.on("join-course", (courseId) => {
      if (courseId) socket.join(`course:${courseId}`);
    });
    socket.on("leave-course", (courseId) => {
      if (courseId) socket.leave(`course:${courseId}`);
    });

    // ── Live class room management ──────────────────────────────────────────
    socket.on("join-liveclass", (liveClassId) => {
      if (liveClassId) socket.join(`liveclass:${liveClassId}`);
    });
    socket.on("leave-liveclass", (liveClassId) => {
      if (liveClassId) socket.leave(`liveclass:${liveClassId}`);
    });

    // ── WebRTC signaling ────────────────────────────────────────────────────
    socket.on("broadcaster", ({ liveClassId }) => {
      if (!liveClassId) return;
      broadcasters.set(liveClassId, socket.id);
      socket.join(`liveclass:${liveClassId}`);
      socket.to(`liveclass:${liveClassId}`).emit("broadcaster-ready", { liveClassId });
    });

    socket.on("viewer", ({ liveClassId, userId, userName }) => {
      if (!liveClassId) return;
      socket.join(`liveclass:${liveClassId}`);
      const broadcasterSocketId = broadcasters.get(liveClassId);
      if (broadcasterSocketId) {
        io.to(broadcasterSocketId).emit("new-viewer", {
          viewerSocketId: socket.id,
          liveClassId,
          userId,
          userName,
        });
      }
    });

    // ── Student camera presence ─────────────────────────────────────────────
    socket.on("student-cam-on", ({ liveClassId, userId, userName }) => {
      if (!liveClassId) return;
      socket
        .to(`liveclass:${liveClassId}`)
        .emit("student-cam-on", { userId, userName, socketId: socket.id });
    });
    socket.on("student-cam-off", ({ liveClassId, userId }) => {
      if (!liveClassId) return;
      socket
        .to(`liveclass:${liveClassId}`)
        .emit("student-cam-off", { userId, socketId: socket.id });
    });

    socket.on("offer", ({ to, offer, liveClassId }) => {
      io.to(to).emit("offer", { from: socket.id, offer, liveClassId });
    });

    socket.on("answer", ({ to, answer, liveClassId }) => {
      io.to(to).emit("answer", { from: socket.id, answer, liveClassId });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("broadcaster-stop", ({ liveClassId }) => {
      if (!liveClassId) return;
      broadcasters.delete(liveClassId);
      socket.to(`liveclass:${liveClassId}`).emit("broadcaster-left", { liveClassId });
    });

    // ── Screen share state ──────────────────────────────────────────────────
    socket.on("screen-share-started", ({ liveClassId, screenStreamId }) => {
      socket.to(`liveclass:${liveClassId}`).emit("screen-share-started", { liveClassId, screenStreamId });
    });
    socket.on("screen-share-stopped", ({ liveClassId }) => {
      socket.to(`liveclass:${liveClassId}`).emit("screen-share-stopped", { liveClassId });
    });

    // ── End class ───────────────────────────────────────────────────────────
    socket.on("end-class", ({ liveClassId }) => {
      if (!liveClassId) return;
      broadcasters.delete(liveClassId);
      io.to(`liveclass:${liveClassId}`).emit("class-ended", { liveClassId });
    });

    // ── Raise / lower hand ──────────────────────────────────────────────────
    socket.on("raise-hand", ({ liveClassId, userId, userName }) => {
      if (!liveClassId) return;
      io.to(`liveclass:${liveClassId}`).emit("hand-raised", { userId, userName });
    });
    socket.on("lower-hand", ({ liveClassId, userId }) => {
      if (!liveClassId) return;
      io.to(`liveclass:${liveClassId}`).emit("hand-lowered", { userId });
    });

    // ── Emoji reactions ─────────────────────────────────────────────────────
    socket.on("send-reaction", ({ liveClassId, emoji, userName }) => {
      if (!liveClassId) return;
      io.to(`liveclass:${liveClassId}`).emit("reaction", { emoji, userName });
    });

    // ── Student mic renegotiation ───────────────────────────────────────────
    socket.on("student-offer", ({ liveClassId, offer }) => {
      const teacherSocketId = broadcasters.get(liveClassId);
      if (teacherSocketId) {
        io.to(teacherSocketId).emit("student-offer", { from: socket.id, offer, liveClassId });
      }
    });
    socket.on("teacher-reanswer", ({ to, answer }) => {
      io.to(to).emit("teacher-reanswer", { answer });
    });

    // ── Speech-to-text subtitles ────────────────────────────────────────────
    // Interim results: relay instantly to all students (no AI processing)
    socket.on("speech:interim", ({ liveClassId, text }) => {
      if (!liveClassId || !text) return;
      socket.to(`liveclass:${liveClassId}`).emit("speech:subtitle", { text });
    });

    // Final results: relay raw immediately, then ask Claude to clean up grammar
    socket.on("speech:final", async ({ liveClassId, text }) => {
      if (!liveClassId || !text) return;
      // Send raw final to students right away so there's no wait
      socket.to(`liveclass:${liveClassId}`).emit("speech:subtitle", { text });

      // Ask Claude to fix grammar/punctuation and re-broadcast the polished version
      try {
        const anthropic = new Anthropic();
        const msg = await anthropic.messages.create({
          model: process.env.AI_MODEL || "claude-sonnet-4-6",
          max_tokens: 256,
          messages: [
            {
              role: "user",
              content:
                `Fix only grammar and punctuation in this live classroom speech transcript. ` +
                `Do NOT change the meaning or add/remove words. ` +
                `Output only the corrected text with no explanation:\n\n${text}`,
            },
          ],
        });
        const corrected = msg.content[0]?.text?.trim();
        // Only re-emit if Claude actually changed something
        if (corrected && corrected !== text) {
          io.to(`liveclass:${liveClassId}`).emit("speech:subtitle", { text: corrected });
        }
      } catch (err) {
        console.error("Claude subtitle correction error:", err.message);
      }
    });

    // Teacher stopped subtitles — clear subtitle bar for all students
    socket.on("speech:stop", ({ liveClassId }) => {
      if (!liveClassId) return;
      socket.to(`liveclass:${liveClassId}`).emit("speech:stop");
    });

    socket.on("disconnect", () => {
      for (const [liveClassId, bSocketId] of broadcasters.entries()) {
        if (bSocketId === socket.id) {
          broadcasters.delete(liveClassId);
          io.to(`liveclass:${liveClassId}`).emit("broadcaster-left", { liveClassId });
          break;
        }
      }
    });
  });

  // ─── Middleware ─────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: [CORS_ORIGIN, "https://smart-class-ivory.vercel.app"],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // ─── Routes ─────────────────────────────────────────────────────────────────
  app.use("/api/auth", authRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api", dashboardRoutes);
  app.use("/api/assignments", assignmentRoutes);
  app.use("/api/quizzes", quizRoutes);
  app.use("/api/live-classes", liveClassRoutes);
  app.use("/api/enrollments", enrollmentRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/profile", profileRoutes);

  app.get("/", (_req, res) => res.json({ message: "SmartClass API is running." }));

  return { app, httpServer };
}
