CREATE TABLE IF NOT EXISTS photos (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  url           TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  thumb_hash    TEXT,
  title         TEXT NOT NULL DEFAULT '',
  description   TEXT DEFAULT '',
  width         INTEGER NOT NULL DEFAULT 0,
  height        INTEGER NOT NULL DEFAULT 0,
  aspect_ratio  REAL,
  size          INTEGER,
  format        TEXT,
  date          TEXT,
  geo_lat       REAL,
  geo_lng       REAL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_user   ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_date   ON photos(date);
CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(user_id, created_at);

CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photo_tags (
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (photo_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag_id);
