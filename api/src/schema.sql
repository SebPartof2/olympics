-- Countries participating in the Olympics
CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  flag_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sports/disciplines
CREATE TABLE IF NOT EXISTS sports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events within sports
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date DATETIME,
  venue TEXT,
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'live', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medal awards
CREATE TABLE IF NOT EXISTS medals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
  athlete_name TEXT NOT NULL,
  medal_type TEXT NOT NULL CHECK(medal_type IN ('gold', 'silver', 'bronze')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Live results/scores
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
  athlete_name TEXT,
  score TEXT,
  position INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_sport ON events(sport_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_medals_country ON medals(country_id);
CREATE INDEX IF NOT EXISTS idx_medals_event ON medals(event_id);
CREATE INDEX IF NOT EXISTS idx_results_event ON results(event_id);
