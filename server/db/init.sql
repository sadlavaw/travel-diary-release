-- Full database init for production (Railway)
-- Run this once after creating the PostgreSQL plugin

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar TEXT,
  bio TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

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
);

CREATE TABLE IF NOT EXISTS user_friends (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id)
);
