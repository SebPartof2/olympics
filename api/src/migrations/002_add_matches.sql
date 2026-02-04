-- Migration: Add matches table for tracking individual games within rounds
-- Used for team sports (basketball, soccer), round robin (curling), etc.

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_round_id INTEGER REFERENCES event_rounds(id) ON DELETE CASCADE,
  match_name TEXT,
  team_a_country_id INTEGER REFERENCES countries(id),
  team_b_country_id INTEGER REFERENCES countries(id),
  team_a_name TEXT,
  team_b_name TEXT,
  team_a_score TEXT,
  team_b_score TEXT,
  winner_country_id INTEGER REFERENCES countries(id),
  start_time_utc DATETIME,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(event_round_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_a ON matches(team_a_country_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_b ON matches(team_b_country_id);
