-- Migration: Add logo/icon URL columns
-- Run this on existing databases to add the new columns

-- Add logo_url to olympics table
ALTER TABLE olympics ADD COLUMN logo_url TEXT;

-- Rename icon to icon_url in sports table (SQLite doesn't support RENAME COLUMN in older versions)
-- So we add the new column if it doesn't exist
ALTER TABLE sports ADD COLUMN icon_url TEXT;

-- Copy data from icon to icon_url if icon column exists (optional, run manually if needed)
-- UPDATE sports SET icon_url = icon WHERE icon IS NOT NULL;
