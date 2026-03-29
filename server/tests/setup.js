import mongoose from 'mongoose';
import { vi, beforeAll, afterAll } from 'vitest';

// ── Module mocks ────────────────────────────────────────────────────────────

vi.mock('../app/services/socketService.js', () => ({
  initIO: vi.fn(),
  getIO: vi.fn(() => ({
    to: vi.fn(() => ({ emit: vi.fn() })),
    emit: vi.fn(),
  })),
}));

vi.mock('../app/config/NodeMailer.js', () => ({
  default: {
    sendMail: vi.fn(async ({ html }) => {
      const match = html?.match(/(\d{6})/);
      if (match) global.__testOtp = match[1];
      return { messageId: 'test-msg-id' };
    }),
  },
}));

// ── DB lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  const uri = process.env.VITEST_MONGO_URI;
  if (!uri) throw new Error('VITEST_MONGO_URI not set — check globalSetup.js');
  process.env.MONGO_URI = uri;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

// NOTE: No afterEach here — tests within a file share beforeAll state.
// Each test FILE adds its own afterAll to wipe collections between files.
