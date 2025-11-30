/**
 * Example business logic using Drizzle
 *
 * DB client is obtained from client.ts
 * During tests, client.ts is mocked to use vDrizzle.client
 */

import { eq } from 'drizzle-orm';
import { getClient } from './client';
import { users, posts } from './schema';

// User operations
export async function createUser(name: string, email: string) {
  const [user] = await getClient()
    .insert(users)
    .values({ name, email })
    .returning();
  return user;
}

export async function getUserById(id: number) {
  const [user] = await getClient().select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await getClient()
    .select()
    .from(users)
    .where(eq(users.email, email));
  return user ?? null;
}

export async function getAllUsers() {
  return getClient().select().from(users);
}

export async function getUserCount() {
  const result = await getClient().select().from(users);
  return result.length;
}

// Post operations
export async function createPost(
  title: string,
  content: string,
  userId: number
) {
  const [post] = await getClient()
    .insert(posts)
    .values({ title, content, userId })
    .returning();
  return post;
}

export async function getPostsByUserId(userId: number) {
  return getClient().select().from(posts).where(eq(posts.userId, userId));
}

export async function getAllPosts() {
  return getClient().select().from(posts);
}

// Composite operation to create user and posts simultaneously
export async function createUserWithPosts(
  name: string,
  email: string,
  postTitles: string[]
) {
  const user = await createUser(name, email);

  const createdPosts = await Promise.all(
    postTitles.map((title) => createPost(title, `Content of ${title}`, user.id))
  );

  return { user, posts: createdPosts };
}
