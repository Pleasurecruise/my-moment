CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('anime', 'film')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  watched_date TEXT,
  image_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS media_user_idx ON media_items(user_id);
CREATE INDEX IF NOT EXISTS media_kind_date_idx ON media_items(kind, watched_date);
