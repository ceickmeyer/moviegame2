// src/lib/db.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Get the appropriate database path based on environment
function getDatabasePath() {
  // Check if we're on Vercel
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    // On Vercel, use the /tmp directory for the database
    // This is temporary storage that exists for the lifetime of a serverless function invocation
    const dbPath = path.join('/tmp', 'moviegame.db');
    return dbPath;
  } else if (process.env.NODE_ENV === 'production') {
    // In non-Vercel production, use the data directory in the project root
    return path.join(process.cwd(), 'data', 'moviegame.db');
  } else {
    // In development, use the data directory in the project root
    const dbDir = path.join(process.cwd(), 'data');
    // Ensure the directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    return path.join(dbDir, 'moviegame.db');
  }
}

// Initialize SQLite database
export async function initDB() {
  const dbPath = getDatabasePath();
  
  // Log the database path for debugging
  console.log(`Opening SQLite database at: ${dbPath}`);
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create movies table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      year TEXT NOT NULL,
      rating TEXT,
      director TEXT,
      poster_path TEXT,
      is_liked BOOLEAN DEFAULT FALSE,
      UNIQUE(title, year)
    )
  `);

  // Create genres table (many-to-many with movies)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Create movie_genres junction table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS movie_genres (
      movie_id TEXT NOT NULL,
      genre_id INTEGER NOT NULL,
      PRIMARY KEY (movie_id, genre_id),
      FOREIGN KEY (movie_id) REFERENCES movies(id),
      FOREIGN KEY (genre_id) REFERENCES genres(id)
    )
  `);

  // Create actors table (many-to-many with movies)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS actors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Create movie_actors junction table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS movie_actors (
      movie_id TEXT NOT NULL,
      actor_id INTEGER NOT NULL,
      PRIMARY KEY (movie_id, actor_id),
      FOREIGN KEY (movie_id) REFERENCES movies(id),
      FOREIGN KEY (actor_id) REFERENCES actors(id)
    )
  `);

  // Create reviews table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id TEXT NOT NULL,
      text TEXT NOT NULL,
      rating TEXT,
      has_rating BOOLEAN DEFAULT FALSE,
      is_liked BOOLEAN DEFAULT FALSE,
      likes INTEGER DEFAULT 0,
      url TEXT,
      author TEXT,
      FOREIGN KEY (movie_id) REFERENCES movies(id)
    )
  `);

  // Create clues table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS clues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL UNIQUE,
      is_approved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

export type DB = Awaited<ReturnType<typeof initDB>>;