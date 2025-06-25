CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teaching activity categories
CREATE TABLE IF NOT EXISTS teaching_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('dance', 'exercise', 'fighting', 'cooking')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  description TEXT NOT NULL,
  estimated_duration INTEGER NOT NULL, -- in seconds
  prerequisites VARCHAR(100)[],
  target_muscles VARCHAR(50)[], -- for exercises
  calories_burn INTEGER, -- for exercises
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual steps for each activity
CREATE TABLE IF NOT EXISTS teaching_activity_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES teaching_activities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  animation_path VARCHAR(255) NOT NULL,
  voice_instruction TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  "order" INTEGER NOT NULL,
  check_points JSONB, -- json array of body checkpoints
  tips TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles with teaching preferences
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE,
  preferences JSONB DEFAULT '{}',
  interests VARCHAR(50)[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity progress for each user
CREATE TABLE IF NOT EXISTS user_activity_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES teaching_activities(id) ON DELETE CASCADE,
  last_completed TIMESTAMPTZ,
  sessions_completed INTEGER DEFAULT 0,
  skill_level INTEGER DEFAULT 0, -- 0-100
  best_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- Activity sessions
CREATE TABLE IF NOT EXISTS activity_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES teaching_activities(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  feedback JSONB DEFAULT '[]',
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample data for teaching activities
INSERT INTO teaching_activities (name, type, difficulty, description, estimated_duration)
VALUES 
  ('Basic Moonwalk', 'dance', 'beginner', 'Learn the iconic Michael Jackson moonwalk dance move step by step', 300),
  ('Hip Hop Dance Basics', 'dance', 'beginner', 'Master the foundational moves of hip hop dancing', 600),
  ('Full Body HIIT Workout', 'exercise', 'intermediate', 'High intensity interval training to burn calories and build strength', 1200),
  ('Basic Boxing Stance & Jab', 'fighting', 'beginner', 'Learn the proper fighting stance and how to throw a jab', 450),
  ('Simple Pasta Carbonara', 'cooking', 'beginner', 'Cook a delicious pasta carbonara with just a few ingredients', 900);

-- Sample steps for Moonwalk
INSERT INTO teaching_activity_steps (activity_id, name, description, animation_path, voice_instruction, duration, "order")
VALUES 
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Moonwalk'), 'Starting Position', 'Stand with your feet together and weight on your toes', '/public/ECHO/animations/dance/moonwalk_start.fbx', 'Start with your feet together and your weight on the balls of your feet. Stand tall with good posture.', 20, 1),
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Moonwalk'), 'Heel Lift', 'Lift the heel of your left foot and place weight on the ball of your foot', '/public/ECHO/animations/dance/moonwalk_heel_lift.fbx', 'Lift the heel of your left foot so you''re standing on the ball of that foot.', 20, 2),
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Moonwalk'), 'Slide Back', 'Smoothly slide your right foot backward while keeping it flat', '/public/ECHO/animations/dance/moonwalk_slide.fbx', 'Now smoothly slide your right foot backward while keeping it flat on the floor. Keep your weight on the ball of your left foot.', 30, 3),
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Moonwalk'), 'Weight Transfer', 'Transfer your weight to your right foot', '/public/ECHO/animations/dance/moonwalk_transfer.fbx', 'Transfer your weight to your right foot, now lifting the heel of your right foot.', 20, 4),
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Moonwalk'), 'Repeat Other Side', 'Repeat the same motion with your left foot sliding back', '/public/ECHO/animations/dance/moonwalk_repeat.fbx', 'Now slide your left foot back while keeping your right heel raised. Continue alternating to create the illusion of walking forward while moving backward.', 40, 5),
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Moonwalk'), 'Full Moonwalk', 'Combine all steps into a smooth moonwalk motion', '/public/ECHO/animations/dance/moonwalk_full.fbx', 'Let''s put it all together into one smooth motion. Heel up, slide back, transfer weight, and repeat. Remember to keep your upper body relaxed.', 60, 6);

-- Sample steps for Boxing Stance
INSERT INTO teaching_activity_steps (activity_id, name, description, animation_path, voice_instruction, duration, "order")
VALUES 
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Boxing Stance & Jab'), 'Proper Stance', 'Position your feet shoulder-width apart with your dominant foot behind', '/public/ECHO/animations/fight/stance_basic.fbx', 'Start with your feet shoulder-width apart. If you''re right-handed, your left foot should be in front. Keep your knees slightly bent.', 30, 1),
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Boxing Stance & Jab'), 'Hand Position', 'Position your hands up to protect your face', '/public/ECHO/animations/fight/stance_hands.fbx', 'Bring your hands up to protect your face. Your lead hand (left for right-handed fighters) should be slightly extended, with your rear hand protecting your chin.', 25, 2),
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Boxing Stance & Jab'), 'Weight Distribution', 'Distribute your weight evenly between both feet', '/public/ECHO/animations/fight/stance_weight.fbx', 'Distribute your weight evenly between both feet, staying on the balls of your feet for better mobility.', 20, 3),
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Boxing Stance & Jab'), 'Basic Jab', 'Extend your lead hand straight forward and quickly return', '/public/ECHO/animations/fight/jab_basic.fbx', 'Now for the jab. Extend your lead hand straight forward, rotating your palm down slightly as you punch. Quickly return to your guard position.', 35, 4),
  ((SELECT id FROM teaching_activities WHERE name = 'Basic Boxing Stance & Jab'), 'Jab from Movement', 'Practice jabbing while moving in your stance', '/public/ECHO/animations/fight/jab_moving.fbx', 'Let''s try jabbing while moving. Take a small step forward with your lead foot as you jab, then return to your stance.', 40, 5);
