// lib/db.ts

import { Pool, type QueryResultRow, type PoolClient } from 'pg';

declare global {
  var pgPool: Pool | undefined;
}

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.POSTGRES_URI,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export const pool = global.pgPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
}

async function checkConnection(client: PoolClient): Promise<boolean> {
  try {
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// This is the function you call instead of pool.query() directly.
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const client = await pool.connect();

    try {
      const isAlive = await checkConnection(client);

      if (!isAlive) {
        client.release(true);

        if (attempt === MAX_RETRIES) {
          throw new Error(
            `Database connection check failed after ${MAX_RETRIES} attempts — the database may still be waking up from sleep.`
          );
        }

        console.warn(
          `Connection check failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS * attempt}ms — likely Neon waking up from sleep.`
        );
        await sleep(RETRY_DELAY_MS * attempt);
        continue; 
      }

      const result = await client.query<T>(text, params);
      return result.rows;
    } catch (error) {
      lastError = error;

      if (attempt === MAX_RETRIES) {
        throw error;
      }

      console.warn(
        `Query failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS * attempt}ms.`,
        error instanceof Error ? error.message : error
      );
      await sleep(RETRY_DELAY_MS * attempt);
    } finally {
      if (client.listenerCount('error') > 0) {
        client.release();
      }
    }
  }

  throw lastError;
}