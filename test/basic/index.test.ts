/**
 * Tests for @siu-issiki/vitest-drizzle-pg
 *
 * setupDrizzleEnvironment is already set up in setup.ts.
 * By mocking client.ts to return vDrizzle.client,
 * each test automatically runs within a transaction and rolls back when finished.
 */

import { describe, test, expect, vi } from 'vitest';

// Mock client.ts to return vDrizzle.client
vi.mock('../client', () => ({
  getClient: () => vDrizzle.client,
}));

import {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  getUserCount,
  createPost,
  getPostsByUserId,
  getAllPosts,
  createUserWithPosts,
} from '../index';

// ============================================================
// Tests to verify isolation between tests
// ============================================================

describe('Test isolation', () => {
  test('Test 1: Create 3 users', async () => {
    await createUser('User 1', 'user1@example.com');
    await createUser('User 2', 'user2@example.com');
    await createUser('User 3', 'user3@example.com');

    const count = await getUserCount();
    expect(count).toBe(3);
  });

  test('Test 2: Previous test data does not exist (isolation verification)', async () => {
    // The 3 users created in Test 1 should have been rolled back
    const count = await getUserCount();
    expect(count).toBe(0);
  });

  test('Test 3: Can create with same email (proof that previous test was rolled back)', async () => {
    // Can create with same email as Test 1 = previous test data is gone
    const user = await createUser('Another User 1', 'user1@example.com');
    expect(user.email).toBe('user1@example.com');
  });

  test('Test 4: Same email can be used in yet another test', async () => {
    const user = await createUser('Yet Another User', 'user1@example.com');
    expect(user.email).toBe('user1@example.com');

    const count = await getUserCount();
    expect(count).toBe(1);
  });
});

// ============================================================
// CRUD operation tests
// ============================================================

describe('User CRUD operations', () => {
  test('Can create a user and retrieve by ID', async () => {
    const created = await createUser('Taro Yamada', 'yamada@example.com');
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Taro Yamada');

    const found = await getUserById(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Taro Yamada');
  });

  test('Can retrieve a user by email', async () => {
    await createUser('Hanako Sato', 'sato@example.com');

    const found = await getUserByEmail('sato@example.com');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Hanako Sato');
  });

  test('Returns null for non-existent user', async () => {
    const found = await getUserById(99999);
    expect(found).toBeNull();
  });

  test('Can retrieve all users', async () => {
    await createUser('User A', 'a@example.com');
    await createUser('User B', 'b@example.com');

    const allUsers = await getAllUsers();
    expect(allUsers).toHaveLength(2);
  });
});

// ============================================================
// Relation operation tests
// ============================================================

describe('Posts and relations', () => {
  test('Can create and retrieve user posts', async () => {
    const user = await createUser('Blogger', 'blogger@example.com');
    await createPost('First post', 'Hello!', user.id);
    await createPost('Second post', 'Continued', user.id);

    const userPosts = await getPostsByUserId(user.id);
    expect(userPosts).toHaveLength(2);
  });

  test('Posts from previous test do not exist', async () => {
    const allPosts = await getAllPosts();
    expect(allPosts).toHaveLength(0);
  });

  test('Can create user and posts simultaneously', async () => {
    const { user, posts } = await createUserWithPosts(
      'Writer',
      'writer@example.com',
      ['Chapter 1', 'Chapter 2', 'Chapter 3']
    );

    expect(user.name).toBe('Writer');
    expect(posts).toHaveLength(3);

    const foundPosts = await getPostsByUserId(user.id);
    expect(foundPosts).toHaveLength(3);
  });
});

// ============================================================
// Isolation verification in parallel tests
// ============================================================

describe('Isolation between multiple describe blocks', () => {
  test('Data is empty in this describe block too', async () => {
    const users = await getAllUsers();
    const posts = await getAllPosts();

    expect(users).toHaveLength(0);
    expect(posts).toHaveLength(0);
  });

  test('Large amount of data is rolled back', async () => {
    // Create 10 users
    for (let i = 0; i < 10; i++) {
      const user = await createUser(`User${i}`, `user${i}@example.com`);
      // 5 posts for each user
      for (let j = 0; j < 5; j++) {
        await createPost(`Post${i}-${j}`, `Content${i}-${j}`, user.id);
      }
    }

    const userCount = await getUserCount();
    const allPosts = await getAllPosts();

    expect(userCount).toBe(10);
    expect(allPosts).toHaveLength(50);
  });

  test('Data is empty after large data test', async () => {
    const users = await getAllUsers();
    const posts = await getAllPosts();

    expect(users).toHaveLength(0);
    expect(posts).toHaveLength(0);
  });
});

