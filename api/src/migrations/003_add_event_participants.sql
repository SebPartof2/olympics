-- Event Participants (countries competing in each medal event)
CREATE TABLE IF NOT EXISTS event_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medal_event_id INTEGER NOT NULL REFERENCES medal_events(id) ON DELETE CASCADE,
  country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  seed_position INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(medal_event_id, country_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(medal_event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_country ON event_participants(country_id);
