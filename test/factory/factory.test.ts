/**
 * Tests for @praha/drizzle-factory compatibility
 *
 * This test file verifies that @praha/drizzle-factory works correctly
 * with @siu-issiki/vitest-drizzle-pg's transaction management.
 *
 * The key point is that factories should use vDrizzle.client
 * (the transaction-wrapped client) to ensure proper rollback.
 */

import { describe, test, expect } from 'vitest';
import { usersFactory, postsFactory, factories } from './factories';
import { users, posts } from '../schema';

// ============================================================
// Basic factory tests
// ============================================================

describe('@praha/drizzle-factory compatibility', () => {
  test('can create a single user using factory', async () => {
    // Use vDrizzle.client which is the transaction-wrapped DB
    const user = await usersFactory(vDrizzle.client).create();

    expect(user.id).toBeDefined();
    expect(user.name).toMatch(/^Test User \d+$/);
    expect(user.email).toMatch(/^user\d+@example\.com$/);
  });

  test('can create multiple users using factory', async () => {
    // Use create(length) to create multiple records
    const createdUsers = await usersFactory(vDrizzle.client).create(3);

    expect(createdUsers).toHaveLength(3);
    createdUsers.forEach((user) => {
      expect(user.id).toBeDefined();
      expect(user.name).toContain('Test User');
    });
  });

  test('can override factory values', async () => {
    const user = await usersFactory(vDrizzle.client).create({
      name: 'Custom Name',
      email: 'custom@example.com',
    });

    expect(user.name).toBe('Custom Name');
    expect(user.email).toBe('custom@example.com');
  });

  test('factory-created data is properly rolled back', async () => {
    // Create some data
    await usersFactory(vDrizzle.client).create(5);

    const count = await vDrizzle.client.select().from(users);
    expect(count).toHaveLength(5);
  });

  test('previous test data does not exist (rollback verification)', async () => {
    // The 5 users from the previous test should be rolled back
    const allUsers = await vDrizzle.client.select().from(users);
    expect(allUsers).toHaveLength(0);
  });
});

// ============================================================
// Factory with relations tests
// ============================================================

describe('@praha/drizzle-factory with relations', () => {
  test('can create user and posts with factory', async () => {
    // First create a user
    const user = await usersFactory(vDrizzle.client).create();

    // Then create posts for that user
    const post1 = await postsFactory(vDrizzle.client).create({
      userId: user.id,
    });
    const post2 = await postsFactory(vDrizzle.client).create({
      userId: user.id,
    });

    expect(post1.userId).toBe(user.id);
    expect(post2.userId).toBe(user.id);

    // Verify posts are in the database
    const userPosts = await vDrizzle.client.select().from(posts);
    expect(userPosts).toHaveLength(2);
  });

  test('relations data is properly rolled back', async () => {
    // Previous test's user and posts should be rolled back
    const allUsers = await vDrizzle.client.select().from(users);
    const allPosts = await vDrizzle.client.select().from(posts);

    expect(allUsers).toHaveLength(0);
    expect(allPosts).toHaveLength(0);
  });

  test('can create complex data structures', async () => {
    // Create 3 users
    const usersList = await usersFactory(vDrizzle.client).create(3);

    // Create 2 posts for each user
    for (const user of usersList) {
      await postsFactory(vDrizzle.client).create([
        { userId: user.id },
        { userId: user.id },
      ]);
    }

    const allUsers = await vDrizzle.client.select().from(users);
    const allPosts = await vDrizzle.client.select().from(posts);

    expect(allUsers).toHaveLength(3);
    expect(allPosts).toHaveLength(6);
  });
});

// ============================================================
// Isolation tests with factories
// ============================================================

describe('Factory isolation between tests', () => {
  test('Test A: Create users with unique emails', async () => {
    const user = await usersFactory(vDrizzle.client).create({
      email: 'unique-email@test.com',
    });

    expect(user.email).toBe('unique-email@test.com');
  });

  test('Test B: Can use same email (proof of isolation)', async () => {
    // Should be able to use the same email since Test A was rolled back
    const user = await usersFactory(vDrizzle.client).create({
      email: 'unique-email@test.com',
    });

    expect(user.email).toBe('unique-email@test.com');
  });

  test('Test C: Factory sequence continues but data is isolated', async () => {
    // Even if sequence numbers continue, each test starts with empty tables
    const user = await usersFactory(vDrizzle.client).create();

    // Only one user should exist
    const allUsers = await vDrizzle.client.select().from(users);
    expect(allUsers).toHaveLength(1);
  });
});

// ============================================================
// Override with array tests
// ============================================================

describe('@praha/drizzle-factory with array overrides', () => {
  test('can create multiple users with different overrides', async () => {
    const createdUsers = await usersFactory(vDrizzle.client).create([
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Charlie', email: 'charlie@example.com' },
    ]);

    expect(createdUsers).toHaveLength(3);
    expect(createdUsers[0].name).toBe('Alice');
    expect(createdUsers[1].name).toBe('Bob');
    expect(createdUsers[2].name).toBe('Charlie');
  });

  test('data from previous test is rolled back', async () => {
    const allUsers = await vDrizzle.client.select().from(users);
    expect(allUsers).toHaveLength(0);
  });
});

// ============================================================
// Using factories() helper (recommended way)
// ============================================================

describe('Using factories() helper - cleaner syntax', () => {
  test('can create user without passing client manually', async () => {
    // No need to pass vDrizzle.client every time!
    const { users: usersF } = factories();
    const user = await usersF.create();

    expect(user.id).toBeDefined();
    expect(user.name).toMatch(/^Test User \d+$/);
  });

  test('can create user and posts with cleaner syntax', async () => {
    const { users: usersF, posts: postsF } = factories();

    const user = await usersF.create({ name: 'Factory Helper User' });
    const post = await postsF.create({ userId: user.id });

    expect(user.name).toBe('Factory Helper User');
    expect(post.userId).toBe(user.id);
  });

  test('can create multiple records easily', async () => {
    const { users: usersF } = factories();

    const createdUsers = await usersF.create(5);

    expect(createdUsers).toHaveLength(5);
  });

  test('data is still properly rolled back', async () => {
    const allUsers = await vDrizzle.client.select().from(users);
    expect(allUsers).toHaveLength(0);
  });
});

