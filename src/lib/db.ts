import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL || "http://localhost:8080";
export const db = createClient({ url });

setupDatabase();

export async function setupDatabase() {
  console.log("🛠️ Syncing Database Schema...");
  try {
    // 1. Create Lessons Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        sections TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        category TEXT DEFAULT 'Uncategorized'
      );
    `);

    // 2. Create Activity Logs Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          action TEXT, -- e.g., 'EDIT_LESSON', 'CHANGE_OWNER'
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create Users Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      );
    `);

    console.log("✅ Database schema is ready.");
  } catch (err: any) {
    console.error("❌ Failed to setup database:", err.message);
  }
}
