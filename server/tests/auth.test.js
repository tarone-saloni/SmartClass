import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import User from '../app/models/User.js';
import { buildApp } from '../app.js';

// NodeMailer is mocked globally in tests/setup.js.
// global.__testOtp is populated there after each sendMail call.

const { app } = buildApp();
const request = supertest(app);

// ─────────────────────────────────────────────────────────────────────────────
describe('Auth API', () => {

  // ── POST /api/auth/register ────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('creates a pending user and responds with OTP message', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@test.io', password: 'Pass123!', role: 'student' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ email: 'alice@test.io' });
      expect(res.body.message).toMatch(/otp/i);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ email: 'missing@test.io' }); // no name or password

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 409 when email is already verified', async () => {
      // Create a verified user directly (model hashes the password)
      await User.create({
        name: 'Existing',
        email: 'existing@test.io',
        password: 'Pass123!',
        isVerified: true,
      });

      const res = await request
        .post('/api/auth/register')
        .send({ name: 'Existing', email: 'existing@test.io', password: 'Pass123!' });

      expect(res.status).toBe(409);
    });
  });

  // ── POST /api/auth/verify-otp ──────────────────────────────────────────────
  describe('POST /api/auth/verify-otp', () => {
    it('verifies a valid OTP, marks user verified, and sets auth cookie', async () => {
      // Step 1: register — the mocked sendMail captures the OTP
      await request
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'bob@test.io', password: 'Pass123!', role: 'student' });

      const otp = global.__testOtp;
      expect(otp).toBeDefined();

      // Step 2: verify
      const res = await request
        .post('/api/auth/verify-otp')
        .send({ email: 'bob@test.io', otp });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('bob@test.io');
      expect(res.headers['set-cookie']).toBeDefined();

      const user = await User.findOne({ email: 'bob@test.io' });
      expect(user.isVerified).toBe(true);
    });

    it('returns 400 for an incorrect OTP', async () => {
      await request
        .post('/api/auth/register')
        .send({ name: 'Carol', email: 'carol@test.io', password: 'Pass123!', role: 'student' });

      const res = await request
        .post('/api/auth/verify-otp')
        .send({ email: 'carol@test.io', otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid otp/i);
    });

    it('returns 400 when no OTP exists for the email', async () => {
      const res = await request
        .post('/api/auth/verify-otp')
        .send({ email: 'nobody@test.io', otp: '123456' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when otp field is missing', async () => {
      const res = await request
        .post('/api/auth/verify-otp')
        .send({ email: 'nobody@test.io' });

      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/auth/login ───────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('logs in a verified user and sets auth cookie', async () => {
      // Pass plain password — the User pre-save hook hashes it once
      await User.create({
        name: 'Dave',
        email: 'dave@test.io',
        password: 'Pass123!',
        role: 'student',
        isVerified: true,
      });

      const res = await request
        .post('/api/auth/login')
        .send({ email: 'dave@test.io', password: 'Pass123!' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ email: 'dave@test.io', role: 'student' });
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 401 for a wrong password', async () => {
      await User.create({
        name: 'Eve',
        email: 'eve@test.io',
        password: 'Pass123!',
        role: 'student',
        isVerified: true,
      });

      const res = await request
        .post('/api/auth/login')
        .send({ email: 'eve@test.io', password: 'WrongPass!' });

      expect(res.status).toBe(401);
    });

    it('returns 403 for an unverified user', async () => {
      await User.create({
        name: 'Frank',
        email: 'frank@test.io',
        password: 'Pass123!',
        role: 'student',
        isVerified: false,
      });

      const res = await request
        .post('/api/auth/login')
        .send({ email: 'frank@test.io', password: 'Pass123!' });

      expect(res.status).toBe(403);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({ email: 'nobody@test.io' });

      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/auth/logout ──────────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('responds with a success message', async () => {
      const res = await request.post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);
    });
  });

  // ── POST /api/auth/resend-otp ──────────────────────────────────────────────
  describe('POST /api/auth/resend-otp', () => {
    it('resends OTP for an unverified user', async () => {
      await User.create({
        name: 'Grace',
        email: 'grace@test.io',
        password: 'Pass123!',
        isVerified: false,
      });

      const res = await request
        .post('/api/auth/resend-otp')
        .send({ email: 'grace@test.io' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/resent/i);
    });

    it('returns 400 for an already-verified user', async () => {
      await User.create({
        name: 'Henry',
        email: 'henry@test.io',
        password: 'Pass123!',
        isVerified: true,
      });

      const res = await request
        .post('/api/auth/resend-otp')
        .send({ email: 'henry@test.io' });

      expect(res.status).toBe(400);
    });
  });
});
