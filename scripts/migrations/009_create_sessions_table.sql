-- Migration 009: Create Sessions Table
-- Purpose: Add missing sessions table for cart and analytics tracking
-- Date: 2025-11-21

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),
    os VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active) WHERE is_active = true;

-- Add comments
COMMENT ON TABLE sessions IS 'User session tracking for both authenticated and guest users';
COMMENT ON COLUMN sessions.session_token IS 'Unique session identifier token';
COMMENT ON COLUMN sessions.user_id IS 'Associated user (NULL for guest sessions)';
COMMENT ON COLUMN sessions.expires_at IS 'Session expiration timestamp';
COMMENT ON COLUMN sessions.last_activity IS 'Last activity timestamp for session timeout tracking';

-- Create function to clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions
    WHERE expires_at < CURRENT_TIMESTAMP
    OR (last_activity < CURRENT_TIMESTAMP - INTERVAL '24 hours' AND user_id IS NULL);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_sessions IS 'Removes expired sessions and inactive guest sessions older than 24 hours';

-- Create function to update last activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create trigger to auto-update last_activity
-- (Can be enabled if you want automatic updates on any session record change)
-- CREATE TRIGGER trigger_update_session_activity
-- BEFORE UPDATE ON sessions
-- FOR EACH ROW
-- EXECUTE FUNCTION update_session_activity();
