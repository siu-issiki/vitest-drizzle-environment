/**
 * Vitest setup file
 *
 * By calling setupDrizzleEnvironment in this file,
 * transaction management is automatically enabled for all test files.
 */

import { beforeAll, afterAll } from 'vitest';
import { setupDrizzleEnvironment } from '@siu-issiki/vitest-drizzle-pg';
import { db, initDb, dropTables, closeDb } from '../db';

// Setup before and after tests
beforeAll(async () => {
  await dropTables();
  await initDb();
});

afterAll(async () => {
  await closeDb();
});

// Set up Drizzle environment
// This ensures all tests run within a transaction and auto-rollback when finished
setupDrizzleEnvironment({
  client: () => db,
});

