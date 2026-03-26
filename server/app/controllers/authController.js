import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import transporter from '../config/NodeMailer.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── In-memory OTP store ────────────────────────────────────────────────────
// Structure: email → { otp, timer }
const otpStore = new Map();

function saveOtp(email, otp) {
  // Clear any existing timer for this email
  if (otpStore.has(email)) clearTimeout(otpStore.get(email).timer);

  const timer = setTimeout(() => otpStore.delete(email), 5 * 60 * 1000); // 5 min
  otpStore.set(email, { otp, timer });
}

function getOtp(email) {
  return otpStore.get(email)?.otp ?? null;
}

function deleteOtp(email) {
  const entry = otpStore.get(email);
  if (entry) clearTimeout(entry.timer);
  otpStore.delete(email);
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

const COOKIE_NAME = 'sc_token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function setAuthCookie(res, user) {
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
}

function userPayload(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

async function sendOtpEmail(email, otp) {
  await transporter.sendMail({
    from: `"SmartClass" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your SmartClass verification code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#6366f1;margin-top:0">SmartClass</h2>
        <p style="color:#374151">Your one-time verification code is:</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111827;background:#f3f4f6;border-radius:8px;padding:16px 24px;text-align:center;margin:16px 0">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:14px">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });
}

// ─── Controllers ────────────────────────────────────────────────────────────

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });

  const existing = await User.findOne({ email });
  if (existing?.isVerified)
    return res.status(409).json({ error: 'Email already registered. Please sign in.' });

  // Create or update pending user
  let user = existing || new User({ name, email, password, role: role || 'student' });
  if (existing) {
    user.name = name;
    user.password = password;
    user.role = role || 'student';
  }
  await user.save();

  const otp = generateOtp();
  saveOtp(email, otp);
  await sendOtpEmail(email, otp);

  res.json({ message: 'OTP sent to your email.', email });
}

// POST /api/auth/verify-otp
export async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

  const stored = getOtp(email);
  if (!stored) return res.status(400).json({ error: 'OTP expired or not found. Request a new one.' });
  if (stored !== otp) return res.status(400).json({ error: 'Invalid OTP.' });

  deleteOtp(email);

  const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found.' });

  setAuthCookie(res, user);
  res.json(userPayload(user));
}

// POST /api/auth/resend-otp
export async function resendOtp(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'No account found for this email.' });
  if (user.isVerified) return res.status(400).json({ error: 'Email already verified.' });

  const otp = generateOtp();
  saveOtp(email, otp); // replaces old OTP and resets the 5-min timer
  await sendOtpEmail(email, otp);

  res.json({ message: 'OTP resent successfully.' });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = await User.findOne({ email });
  if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials.' });
  if (!user.isVerified) return res.status(403).json({ error: 'Please verify your email first.' });

  const valid = await user.comparePassword(password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

  setAuthCookie(res, user);
  res.json(userPayload(user));
}

// POST /api/auth/logout
export function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ message: 'Logged out.' });
}

// POST /api/auth/google
export async function googleAuth(req, res) {
  const { credential, role, isAccessToken, email, name, googleId: gId, avatar } = req.body;

  let googleId, userEmail, userName, picture;

  if (isAccessToken) {
    if (!email || !gId) return res.status(400).json({ error: 'Missing Google user info.' });
    googleId = gId;
    userEmail = email;
    userName = name;
    picture = avatar;
  } else {
    if (!credential) return res.status(400).json({ error: 'Google credential is required.' });
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    googleId = payload.sub;
    userEmail = payload.email;
    userName = payload.name;
    picture = payload.picture;
  }

  let user = await User.findOne({ $or: [{ googleId }, { email: userEmail }] });
  if (!user) {
    user = await User.create({
      name: userName,
      email: userEmail,
      googleId,
      avatar: picture,
      role: role || 'student',
      isVerified: true,
    });
  } else {
    if (!user.googleId) user.googleId = googleId;
    user.isVerified = true;
    if (picture && !user.avatar) user.avatar = picture;
    await user.save();
  }

  setAuthCookie(res, user);
  res.json(userPayload(user));
}
