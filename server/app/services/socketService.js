let _io = null;

export function initIO(io) {
  _io = io;
}

export function getIO() {
  if (!_io) throw new Error("Socket.IO not initialized");
  return _io;
}

// ─── Emit helpers ─────────────────────────────────────────────────────────────

/** Emit to every socket in a course room (teacher + all enrolled students) */
export function emitToCourse(courseId, event, data) {
  try {
    getIO().to(`course:${courseId}`).emit(event, data);
  } catch {
    // non-critical
  }
}

/** Emit to a specific user (any tab/device they have open) */
export function emitToUser(userId, event, data) {
  try {
    getIO().to(`user:${userId}`).emit(event, data);
  } catch {
    // non-critical
  }
}
