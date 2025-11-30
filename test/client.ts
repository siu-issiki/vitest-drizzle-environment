/**
 * Module that provides the DB client
 *
 * During tests, this module is mocked to return vDrizzle.client
 */

import { db } from './db';

export function getClient() {
  return db;
}
