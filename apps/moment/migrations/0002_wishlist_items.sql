CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  price REAL NOT NULL DEFAULT 0,
  category TEXT NOT NULL CHECK(category IN ('digital', 'audio', 'home', 'kitchen', 'wear', 'travel', 'health', 'stationery', 'gaming', 'other')),
  image_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS wishlist_user_idx ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS wishlist_created_idx ON wishlist_items(user_id, created_at);
