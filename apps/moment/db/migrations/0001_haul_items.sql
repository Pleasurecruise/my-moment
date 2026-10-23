CREATE TABLE IF NOT EXISTS haul_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  price REAL NOT NULL DEFAULT 0,
  category TEXT NOT NULL CHECK(category IN ('digital', 'audio', 'home', 'kitchen', 'wear', 'travel', 'health', 'stationery', 'gaming', 'other')),
  rating TEXT NOT NULL CHECK(rating IN ('worth', 'great', 'amazing', 'godtier')),
  purchase_date TEXT,
  comment TEXT NOT NULL DEFAULT '',
  image_key TEXT,
  purchase_link TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS haul_user_idx ON haul_items(user_id);
CREATE INDEX IF NOT EXISTS haul_created_idx ON haul_items(user_id, created_at);
