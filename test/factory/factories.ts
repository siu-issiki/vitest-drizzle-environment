/**
 * Factory definitions using @praha/drizzle-factory
 *
 * These factories make it easy to generate test data.
 *
 * Note: @praha/drizzle-factory does not use `returning()`, so it returns
 * the values from the resolver, not the actual inserted values from the DB.
 * Therefore, we must specify the id explicitly in the resolver using sequence.
 */

import { defineFactory, composeFactory } from '@praha/drizzle-factory';
import { users, posts } from '../schema';

// Schema object containing only tables (no relations)
const schema = { users, posts };

/**
 * Factory for users table
 */
export const usersFactory = defineFactory({
  schema,
  table: 'users',
  resolver: ({ sequence }) => ({
    id: sequence, // Explicitly specify id using sequence
    name: `Test User ${sequence}`,
    email: `user${sequence}@example.com`,
    createdAt: null,
  }),
});

/**
 * Factory for posts table
 *
 * Uses the `use` function to automatically create a user if userId is not provided.
 */
export const postsFactory = defineFactory({
  schema,
  table: 'posts',
  resolver: ({ sequence, use }) => ({
    id: sequence, // Explicitly specify id using sequence
    title: `Test Post ${sequence}`,
    content: `This is content of post ${sequence}`,
    createdAt: null,
    // Wrap in function so it's only called when userId is not explicitly provided
    userId: () =>
      use(usersFactory)
        .create()
        .then((user) => user.id),
  }),
});

/**
 * Composed factory - use composeFactory to group all factories
 */
const composedFactory = composeFactory({
  users: usersFactory,
  posts: postsFactory,
});

/**
 * Get factories bound to vDrizzle.client
 *
 * Usage:
 * ```ts
 * const { users, posts } = factories();
 * const user = await users.create();
 * const post = await posts.create({ userId: user.id });
 * ```
 */
export const factories = () => composedFactory(vDrizzle.client);
