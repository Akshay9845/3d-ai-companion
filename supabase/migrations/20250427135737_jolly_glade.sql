/*
  # Create conversations and messages tables

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `title` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `role` (text)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can manage their own conversations"
  ON conversations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for messages
CREATE POLICY "Users can manage messages in their conversations"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );