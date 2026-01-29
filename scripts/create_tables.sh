#!/bin/bash

# Manually create phone_otps table
docker exec fleet_db psql -U fleet_user -d fleet_management << SQL
CREATE TABLE IF NOT EXISTS phone_otps (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    org_id UUID NOT NULL REFERENCES organizations(id),
    otp_code VARCHAR(6) NOT NULL,
    attempts INTEGER DEFAULT 0,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,
    user_agent VARCHAR(500),
    ip_address VARCHAR(45)
);

CREATE INDEX idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX idx_phone_otps_org ON phone_otps(org_id);

-- Also create user_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT TRUE NOT NULL,
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    UNIQUE(user_id, permission_name)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_org ON user_permissions(org_id);

-- Create permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

SELECT 'Tables created successfully!' as result;
SQL
