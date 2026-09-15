-- Phase 6 Migration: User Activity and Admin Tracking

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS login_count INT NOT NULL DEFAULT 1 AFTER status,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL AFTER login_count;
