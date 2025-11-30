import type { db } from '../db';

// Get the type of the callback argument for db.transaction()
type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Extended global declaration for vDrizzle.
 *
 * Note: We use `any` for the client type to bypass type incompatibilities between
 * @praha/drizzle-factory and drizzle-orm versions. The `[IsDrizzleTable]` symbol
 * required by @praha/drizzle-factory is not present in drizzle-orm 0.29.x.
 *
 * At runtime, the transaction works correctly - this is purely a type-level issue.
 */
declare global {
  var vDrizzle: {
    /**
     * Transaction available for use in the current test case.
     * This transaction is automatically rolled back when the test ends.
     *
     * Use `any` type to maintain compatibility with @praha/drizzle-factory.
     * The underlying type is DrizzleTransaction.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: any;
  };
}

export {};

