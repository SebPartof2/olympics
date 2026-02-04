-- Migration: Add logo/icon URL columns and fix medals table schema
-- Run this on existing databases to add the new columns

-- Add logo_url to olympics table
ALTER TABLE olympics ADD COLUMN logo_url TEXT;

-- Rename icon to icon_url in sports table (SQLite doesn't support RENAME COLUMN in older versions)
-- So we add the new column if it doesn't exist
ALTER TABLE sports ADD COLUMN icon_url TEXT;

-- Copy data from icon to icon_url if icon column exists (optional, run manually if needed)
-- UPDATE sports SET icon_url = icon WHERE icon IS NOT NULL;

-- Fix medals table: Add medal_event_id column (replacing old event_id)
ALTER TABLE medals ADD COLUMN medal_event_id INTEGER REFERENCES medal_events(id);
ALTER TABLE medals ADD COLUMN record_type TEXT;
ALTER TABLE medals ADD COLUMN result_value TEXT;

-- Copy existing event_id data to medal_event_id
UPDATE medals SET medal_event_id = event_id WHERE medal_event_id IS NULL AND event_id IS NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_medals_medal_event ON medals(medal_event_id);
