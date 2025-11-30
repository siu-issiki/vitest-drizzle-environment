/**
 * @siu-issiki/vitest-drizzle-pg
 *
 * Provides automatic transaction rollback per test case when using
 * Drizzle ORM (PostgreSQL) in Vitest tests.
 *
 * Inspired by jest-prisma, each test runs within an isolated transaction
 * that automatically rolls back when the test ends.
 *
 * @example
 * ```ts
 * // setup.ts (specified in vitest.config.ts setupFiles)
 * import { setupDrizzleEnvironment } from "@siu-issiki/vitest-drizzle-pg";
 * import { db } from "./db";
 *
 * setupDrizzleEnvironment({
 *   client: () => db,
 * });
 * ```
 *
 * @example
 * ```ts
 * // Test file
 * test("creates a user", async () => {
 *   await vDrizzle.client.insert(users).values({ name: "test" });
 *   const result = await vDrizzle.client.select().from(users);
 *   expect(result).toHaveLength(1);
 * }); // Automatically rolls back when test ends
 * ```
 */

// Export type definitions
export type {
  DrizzleEnvironmentOptions,
  TransactionCapableClient,
  VitestDrizzleContext,
} from './types';

// Export setup function
export { setupDrizzleEnvironment } from './setup';
