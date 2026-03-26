let _io = null;

export function initIO(io) {
  _io = io;
}

export function getIO() {
  if (!_io) throw new Error('Socket.IO not initialized');
  return _io;
}
