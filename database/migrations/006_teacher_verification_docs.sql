-- Phase 7 Migration: Teacher College/Institute ID Card Document Verification

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255) NULL AFTER is_verified_teacher,
    ADD COLUMN IF NOT EXISTS id_card_filename VARCHAR(255) NULL AFTER institution_name,
    ADD COLUMN IF NOT EXISTS id_card_mimetype VARCHAR(100) NULL AFTER id_card_filename,
    ADD COLUMN IF NOT EXISTS id_card_data LONGTEXT NULL AFTER id_card_mimetype,
    ADD COLUMN IF NOT EXISTS verification_status ENUM('none', 'pending', 'verified', 'rejected') NOT NULL DEFAULT 'none' AFTER id_card_data,
    ADD COLUMN IF NOT EXISTS verification_notes TEXT NULL AFTER verification_status,
    ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP NULL AFTER verification_notes,
    ADD COLUMN IF NOT EXISTS reviewed_by INT NULL AFTER verification_submitted_at,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL AFTER reviewed_by;
