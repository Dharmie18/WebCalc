import { readFileSync } from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // List of migration files to run in order
  const migrations = [
    '0000_glorious_young_avengers.sql',
    '0001_furry_warbound.sql',
    '0002_curly_dexter_bennett.sql',
  ];

  try {
    for (const migration of migrations) {
      const sqlFilePath = path.join(process.cwd(), 'drizzle', migration);
      console.log(`Running migration: ${migration}`);
      const sql = readFileSync(sqlFilePath, 'utf-8');

      const statements = sql.split('--> statement-breakpoint').map(st => st.trim()).filter(Boolean);

      for (const stmt of statements) {
        try {
          await client.execute(stmt);
        } catch (err) {
          console.error(`Error running statement in ${migration}:`, err);
          throw err;
        }
      }
      console.log(`Migration ${migration} completed.`);
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
  console.log('All migrations completed successfully.');
}

runMigrations();
