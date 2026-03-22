import sql from './neon.js';

export async function migrate() {
  console.log('Starting migration...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        display_name TEXT,
        photo_url TEXT,
        role TEXT DEFAULT 'user'
      );
    `;

    // Ensure password column exists for existing users table
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;`;
    } catch (e) {
      console.log('Password column might already exist or table is being created.');
    }

    await sql`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        duration TEXT,
        price REAL,
        category TEXT,
        image TEXT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        full_name TEXT,
        email TEXT,
        mobile_number TEXT,
        education TEXT,
        city_name TEXT,
        course_interested TEXT,
        status TEXT DEFAULT 'New',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS hiring (
        id TEXT PRIMARY KEY,
        title TEXT,
        company TEXT,
        location TEXT,
        description TEXT,
        requirements TEXT,
        type TEXT,
        salary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        full_name TEXT,
        email TEXT,
        mobile TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
