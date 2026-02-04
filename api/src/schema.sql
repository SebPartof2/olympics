-- Settings for the application
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('default_timezone', 'America/New_York');
INSERT OR IGNORE INTO settings (key, value) VALUES ('active_olympics_id', '');

-- Olympics (Summer 2024, Winter 2026, etc.)
CREATE TABLE IF NOT EXISTS olympics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('summer', 'winter', 'youth', 'paralympics')),
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  logo_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Countries (global list, shared across all Olympics)
CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  flag_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sports/disciplines (global list)
CREATE TABLE IF NOT EXISTS sports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medal Events (linked to specific Olympics)
CREATE TABLE IF NOT EXISTS medal_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  olympics_id INTEGER NOT NULL REFERENCES olympics(id) ON DELETE CASCADE,
  sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK(gender IN ('men', 'women', 'mixed')) DEFAULT 'mixed',
  event_type TEXT DEFAULT 'individual',
  venue TEXT,
  scheduled_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Event Rounds (heats, quarterfinals, semifinals, finals, etc.)
CREATE TABLE IF NOT EXISTS event_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medal_event_id INTEGER REFERENCES medal_events(id) ON DELETE CASCADE,
  round_type TEXT NOT NULL CHECK(round_type IN ('heat', 'repechage', 'quarterfinal', 'semifinal', 'final', 'bronze_final', 'group_stage', 'knockout', 'qualification', 'preliminary', 'round_robin')),
  round_number INTEGER DEFAULT 1,
  round_name TEXT,
  start_time_utc DATETIME NOT NULL,
  end_time_utc DATETIME,
  venue TEXT,
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'delayed', 'live', 'completed', 'cancelled')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Matches within rounds (for team sports, round robin, etc.)
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
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'delayed', 'live', 'completed', 'cancelled')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medal awards (linked to medal events)
CREATE TABLE IF NOT EXISTS medals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medal_event_id INTEGER REFERENCES medal_events(id) ON DELETE CASCADE,
  country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
  athlete_name TEXT NOT NULL,
  medal_type TEXT NOT NULL CHECK(medal_type IN ('gold', 'silver', 'bronze')),
  record_type TEXT,
  result_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Results for each round
CREATE TABLE IF NOT EXISTS round_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_round_id INTEGER REFERENCES event_rounds(id) ON DELETE CASCADE,
  country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
  athlete_name TEXT,
  lane_or_position INTEGER,
  result_value TEXT,
  result_status TEXT,
  final_position INTEGER,
  qualified_to TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_olympics_year ON olympics(year);
CREATE INDEX IF NOT EXISTS idx_olympics_active ON olympics(is_active);
CREATE INDEX IF NOT EXISTS idx_medal_events_olympics ON medal_events(olympics_id);
CREATE INDEX IF NOT EXISTS idx_medal_events_sport ON medal_events(sport_id);
CREATE INDEX IF NOT EXISTS idx_medal_events_date ON medal_events(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_event_rounds_medal_event ON event_rounds(medal_event_id);
CREATE INDEX IF NOT EXISTS idx_event_rounds_start_time ON event_rounds(start_time_utc);
CREATE INDEX IF NOT EXISTS idx_event_rounds_status ON event_rounds(status);
CREATE INDEX IF NOT EXISTS idx_medals_country ON medals(country_id);
CREATE INDEX IF NOT EXISTS idx_medals_event ON medals(medal_event_id);
CREATE INDEX IF NOT EXISTS idx_round_results_round ON round_results(event_round_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(event_round_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_a ON matches(team_a_country_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_b ON matches(team_b_country_id);
