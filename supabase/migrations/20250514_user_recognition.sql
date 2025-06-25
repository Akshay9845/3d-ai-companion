-- User Recognition and Memory System Migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for face recognition
CREATE TABLE IF NOT EXISTS recognized_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  face_embedding JSONB NOT NULL, -- Store face vector from Face API or MediaPipe
  personality_tag TEXT, -- e.g., "fun", "serious", "curious"
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User memory table for personalization
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES recognized_users(id) ON DELETE CASCADE,
  conversation_log JSONB DEFAULT '[]', -- Stores recent chats/keywords
  emotion_trend TEXT, -- e.g., "mostly positive", "anxious", etc.
  preferences JSONB DEFAULT '{}', -- e.g., "likes dancing", "prefers slow pace"
  teaching_style TEXT, -- Preferred teaching style
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update the "updated_at" column
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for recognized_users table
CREATE TRIGGER update_recognized_users_timestamp
BEFORE UPDATE ON recognized_users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Trigger for user_memory table
CREATE TRIGGER update_user_memory_timestamp
BEFORE UPDATE ON user_memory
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Index for faster face embedding searches
CREATE INDEX IF NOT EXISTS recognized_users_face_embedding_idx ON recognized_users USING GIN (face_embedding);
