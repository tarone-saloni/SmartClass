import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export async function setup() {
  mongod = await MongoMemoryServer.create();
  // Pass URI via env so all forked processes can reach the same instance
  process.env.VITEST_MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'vitest_test_secret_12345';
  process.env.NODE_ENV = 'test';
}

export async function teardown() {
  if (mongod) await mongod.stop();
}
