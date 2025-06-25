/*
  # Allow anonymous access to conversations and messages

  1. Changes
    - Add policies for public access to conversations and messages
    - Allow anonymous users to create and read data
    
  2. Security
    - This is temporary for testing purposes
    - Should be replaced with proper authentication in production
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON messages;

-- Add public access policies for conversations
CREATE POLICY "Public access to conversations"
  ON conversations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add public access policies for messages
CREATE POLICY "Public access to messages"
  ON messages
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);