const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');

async function initDB() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar TEXT,
      bio TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trips (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      cover_url TEXT,
      status VARCHAR(20) DEFAULT 'planned',
      visibility VARCHAR(20) DEFAULT 'private',
      start_date DATE,
      end_date DATE,
      regions TEXT[],
      tags TEXT[],
      stops   JSONB NOT NULL DEFAULT '[]',
      legs    JSONB NOT NULL DEFAULT '[]',
      blocks  JSONB NOT NULL DEFAULT '[]',
      days    JSONB NOT NULL DEFAULT '[]',
      route   JSONB NOT NULL DEFAULT '[]',
      photos  JSONB NOT NULL DEFAULT '[]',
      participants JSONB DEFAULT '[]',
      strava  JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_friends (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id, friend_id)
    )
  `);
  console.log('DB tables ready');
}

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
initDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch(e => { console.error('DB init failed:', e.message); process.exit(1); });
