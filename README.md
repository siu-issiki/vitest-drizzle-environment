# @siu-issiki/vitest-drizzle-pg

[![npm version](https://img.shields.io/npm/v/@siu-issiki/vitest-drizzle-pg.svg)](https://www.npmjs.com/package/@siu-issiki/vitest-drizzle-pg)
[![CI](https://github.com/siu-issiki/vitest-drizzle-pg/actions/workflows/test.yml/badge.svg)](https://github.com/siu-issiki/vitest-drizzle-pg/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Vitest environment for Drizzle ORM (PostgreSQL) that provides **automatic transaction rollback per test case**.

Inspired by [jest-prisma](https://github.com/Quramy/jest-prisma), this library executes each test within an isolated transaction and automatically rolls back at the end of the test, ensuring data isolation between tests.

## Features

- 🔄 **Automatic Rollback**: Transactions are automatically rolled back at the end of each test case
- 🧪 **Test Isolation**: Database state is not shared between tests
- 🚀 **Fast**: Real DB operations with rollback for fast test execution
- 🐘 **PostgreSQL Optimized**: Optimal integration with node-postgres

## Installation

```bash
npm install -D @siu-issiki/vitest-drizzle-pg
# or
pnpm add -D @siu-issiki/vitest-drizzle-pg
# or
yarn add -D @siu-issiki/vitest-drizzle-pg
```

## Quick Start

### 1. Create Setup File

```typescript
// setup.ts
import { setupDrizzleEnvironment } from '@siu-issiki/vitest-drizzle-pg';
import { db } from './db'; // Your Drizzle instance

setupDrizzleEnvironment({
  client: () => db,
});
```

### 2. Configure Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./setup.ts'],
  },
});
```

### 3. Write Tests

```typescript
// users.test.ts
import { describe, test, expect } from 'vitest';
import { users } from './schema';

test('can create a user', async () => {
  // vDrizzle.client is the transaction client
  await vDrizzle.client.insert(users).values({
    name: 'Test User',
    email: 'test@example.com',
  });

  const result = await vDrizzle.client.select().from(users);
  expect(result).toHaveLength(1);
}); // ← Automatically rolled back at test end

test('previous test data does not exist', async () => {
  const result = await vDrizzle.client.select().from(users);
  expect(result).toHaveLength(0); // Rolled back!
});
```

## Integration with Business Logic

Instead of using `vDrizzle.client` directly in test files, we recommend abstracting the DB client in your business logic and mocking it in tests.

### 1. Create a Client Module

```typescript
// client.ts
import { db } from './db';

export function getClient() {
  return db;
}
```

### 2. Use the Client Module in Business Logic

```typescript
// users.ts
import { getClient } from './client';
import { users } from './schema';

export async function createUser(name: string, email: string) {
  const [user] = await getClient()
    .insert(users)
    .values({ name, email })
    .returning();
  return user;
}

export async function getAllUsers() {
  return getClient().select().from(users);
}
```

### 3. Mock the Client Module in Tests

```typescript
// users.test.ts
import { describe, test, expect, vi } from 'vitest';

// Mock client.ts to return vDrizzle.client
vi.mock('./client', () => ({
  getClient: () => vDrizzle.client,
}));

import { createUser, getAllUsers } from './users';

test('can create a user', async () => {
  const user = await createUser('Test User', 'test@example.com');
  expect(user.name).toBe('Test User');
});

test('previous test data does not exist', async () => {
  const users = await getAllUsers();
  expect(users).toHaveLength(0);
});
```

## API

### `setupDrizzleEnvironment(options)`

Call this in your Vitest setup file to automatically execute each test within a transaction.

```typescript
setupDrizzleEnvironment({
  // Required: Function that returns the Drizzle instance
  client: () => db,
  
  // Optional: Setup function executed before each test
  setup: async (tx) => {
    // Insert seed data, etc. (executed within the transaction)
    await tx.insert(users).values({ name: 'Admin', email: 'admin@example.com' });
  },
  
  // Optional: Cleanup function executed after each test (before rollback)
  teardown: async (tx) => {
    // Cleanup operations
  },
  
  // Optional: Function to close DB connection at the end of test suite
  disconnect: async () => {
    await pool.end();
  },
});
```

## Type Safety

When using TypeScript, you can enable type inference for `vDrizzle.client` by adding a global type definition.

```typescript
// env.d.ts
import type { db } from './db';
import type { VitestDrizzleContext } from '@siu-issiki/vitest-drizzle-pg';

type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

declare global {
  var vDrizzle: VitestDrizzleContext<DrizzleTransaction>;
}

export {};
```

## How It Works

This library uses a **Promise pending pattern** similar to jest-prisma:

1. Start a transaction with `db.transaction()` at the beginning of each test case
2. Create a new Promise within the transaction and hold the `reject` function
3. Pass the transaction client to the test code
4. Call `reject()` at test end to trigger rollback
5. Use `.catch(() => {})` to prevent Unhandled Rejection

```typescript
// Internal implementation concept
async beginTransaction() {
  return new Promise((resolveOuter) => {
    db.transaction(async (tx) => {
      // Return control to test code
      resolveOuter(tx);
      
      // Wait until test ends
      return new Promise((_, reject) => {
        this.triggerRollback = () => reject(new RollbackError());
      });
    }).catch(() => {}); // Swallow rollback error
  });
}
```

## Development

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
pnpm install

# Build
pnpm build

# Install test dependencies (as local package)
pnpm test:install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Project Structure

```
vitest-drizzle-pg/
├── src/                    # Library source code
├── dist/                   # Build output
├── test/                   # Tests (independent package)
│   ├── package.json        # Installs local package with file:..
│   └── *.test.ts
├── docker-compose.yml
└── package.json
```

The `test/` directory has its own `package.json` and installs `@siu-issiki/vitest-drizzle-pg` as a local package using `file:..`. This allows testing with the same experience as actual package users.

## License

MIT
