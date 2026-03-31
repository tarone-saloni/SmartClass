/**
 * tests/seed.js
 * -----------
 * Seeds the database with two pre-verified test users for shell-script testing.
 * Run before test.sh:
 *   node tests/seed.js
 *
 * Credentials created:
 *   Teacher  →  testteacher@smartclass.io / Teacher123!
 *   Student  →  teststudent@smartclass.io / Student123!
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/smartclass_dev';

// Minimal inline schema so this script has no import-path dependency on app/
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['student', 'teacher'] },
  isVerified: { type: Boolean, default: false },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const SEEDS = [
  {
    name: 'Test Teacher',
    email: 'testteacher@smartclass.io',
    password: 'Teacher123!',
    role: 'teacher',
  },
  {
    name: 'Test Student',
    email: 'teststudent@smartclass.io',
    password: 'Student123!',
    role: 'student',
  },
];

async function seed() {
  console.log(`Connecting to ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')} …`);
  await mongoose.connect(MONGO_URI);

  for (const u of SEEDS) {
    const hash = await bcrypt.hash(u.password, 10);
    await User.findOneAndUpdate(
      { email: u.email },
      { name: u.name, password: hash, role: u.role, isVerified: true },
      { upsert: true, new: true }
    );
    console.log(`  ✔  ${u.role.padEnd(7)} ${u.email}  /  ${u.password}`);
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
