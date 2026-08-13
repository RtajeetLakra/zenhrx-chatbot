-- database/init.sql

-- Enable the pg_trgm extension for fuzzy string matching (if you want to do fuzzy search later)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users table (Admin accounts)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Base Categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Base Questions
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    canonical_question TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Add full text search vector for standard question text
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', canonical_question)) STORED
);

-- Create an index for full text search
CREATE INDEX idx_questions_search ON questions USING GIN(search_vector);

-- Answers for the Questions
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Variations of Questions
CREATE TABLE IF NOT EXISTS question_variations (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    variation_text TEXT NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', variation_text)) STORED
);

CREATE INDEX idx_variations_search ON question_variations USING GIN(search_vector);

-- Keywords for fuzzy matching or explicit tagging
CREATE TABLE IF NOT EXISTS keywords (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL
);

-- Leads table for Lead Capture workflow
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    employee_count VARCHAR(50),
    requirement TEXT,
    preferred_demo_time VARCHAR(100),
    status VARCHAR(50) DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations (Sessions)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, ABANDONED, COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Individual Chat Messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(10) CHECK (sender IN ('user', 'bot')),
    content TEXT NOT NULL,
    confidence_score DECIMAL(4,2), -- Useful for AI response grading
    source VARCHAR(50) DEFAULT 'LOCAL_DB', -- LOCAL_DB, AI_API, FALLBACK
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create some default data (Admin login and generic category)
-- Default admin password is 'admin123' (bcrypt hash)
INSERT INTO users (username, password_hash) VALUES 
('admin', '$2b$10$wN9aWlD/y6Jd1M/Z7.Z4uOt7W1Z2X9YJ3Vz2p9r7K0R7q8z6P1m6q') ON CONFLICT DO NOTHING;

INSERT INTO categories (name, description) VALUES 
('General FAQ', 'General frequently asked questions') ON CONFLICT DO NOTHING;
