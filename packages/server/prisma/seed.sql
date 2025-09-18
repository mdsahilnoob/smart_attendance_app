-- Seed script for Smart Attendance App
-- This script creates initial data for development and testing

-- Insert sample activity suggestions
INSERT INTO activity_suggestions (id, title, description, category, estimated_time, relevant_courses, created_at, updated_at) VALUES
('act_001', 'Practice JavaScript Fundamentals', 'Review basic JavaScript concepts including variables, functions, and loops', 'Programming', 30, ARRAY['CS101', 'WEB101'], NOW(), NOW()),
('act_002', 'Read Chapter on Database Design', 'Study relational database concepts and normalization', 'Database', 45, ARRAY['CS201', 'DB101'], NOW(), NOW()),
('act_003', 'Complete Math Problem Set', 'Solve calculus problems focusing on derivatives and integrals', 'Mathematics', 60, ARRAY['MATH201', 'CALC101'], NOW(), NOW()),
('act_004', 'Review Physics Lab Notes', 'Go through recent physics lab experiments and results', 'Physics', 25, ARRAY['PHYS101', 'LAB101'], NOW(), NOW()),
('act_005', 'Practice English Essay Writing', 'Write a short essay on a topic of choice to improve writing skills', 'English', 40, ARRAY['ENG101', 'COMP101'], NOW(), NOW()),
('act_006', 'Study Data Structures', 'Review arrays, linked lists, stacks, and queues', 'Computer Science', 50, ARRAY['CS102', 'DS101'], NOW(), NOW()),
('act_007', 'Chemistry Formula Review', 'Memorize and practice common chemistry formulas', 'Chemistry', 35, ARRAY['CHEM101', 'SCI101'], NOW(), NOW()),
('act_008', 'History Timeline Study', 'Create timeline of major historical events', 'History', 30, ARRAY['HIST101', 'SOC101'], NOW(), NOW());

-- Note: User data, classes, and other records will be created through the application
-- to ensure proper password hashing and relationship management
