-- COINCIDENZE Database Schema

CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  category TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  website TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exhibitors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  contact_info TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT DEFAULT '',
  location TEXT DEFAULT '',
  category TEXT NOT NULL,
  artist_id TEXT REFERENCES artists(id) ON DELETE SET NULL,
  artist_ids TEXT DEFAULT '[]',
  exhibitor_id TEXT REFERENCES exhibitors(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  assignee_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
  due_date TEXT,
  category TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('audio', 'video', 'image')),
  url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT '',
  artist_id TEXT REFERENCES artists(id) ON DELETE SET NULL,
  category TEXT,
  duration INTEGER,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canvas_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('event', 'artist', 'exhibitor', 'media', 'group')),
  entity_id TEXT,
  label TEXT DEFAULT '',
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  width REAL,
  height REAL,
  parent_id TEXT REFERENCES canvas_nodes(id) ON DELETE SET NULL,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canvas_edges (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  target TEXT NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
  label TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS editorial_posts (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  fase INTEGER NOT NULL DEFAULT 1,
  tag TEXT NOT NULL DEFAULT 'teaser',
  emoji TEXT DEFAULT '',
  titolo TEXT NOT NULL,
  descrizione TEXT DEFAULT '',
  caption_suggerita TEXT DEFAULT '',
  formato TEXT DEFAULT '',
  stato TEXT NOT NULL DEFAULT 'da_fare',
  canva_design_id TEXT,
  artisti_coinvolti TEXT DEFAULT '[]',
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS edizione0_gallery (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS edizione0_content (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS edizione1_gallery (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS edizione1_content (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accreditations (
  id TEXT PRIMARY KEY,
  ticket_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  cap TEXT DEFAULT '',
  birth_date TEXT DEFAULT '',
  consent_privacy INTEGER NOT NULL DEFAULT 0,
  consent_newsletter INTEGER NOT NULL DEFAULT 0,
  consent_photo INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  email_sent_at TEXT,
  checked_in_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_artist ON events(artist_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_media_artist ON media_items(artist_id);
CREATE INDEX IF NOT EXISTS idx_canvas_nodes_type ON canvas_nodes(type);
CREATE INDEX IF NOT EXISTS idx_editorial_posts_data ON editorial_posts(data);
CREATE INDEX IF NOT EXISTS idx_editorial_posts_fase ON editorial_posts(fase);
CREATE INDEX IF NOT EXISTS idx_accreditations_email ON accreditations(email);
CREATE INDEX IF NOT EXISTS idx_accreditations_ticket ON accreditations(ticket_code);
CREATE INDEX IF NOT EXISTS idx_accreditations_created ON accreditations(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
