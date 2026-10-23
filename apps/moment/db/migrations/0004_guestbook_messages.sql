CREATE TABLE IF NOT EXISTS "guestbook_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "parentId" TEXT REFERENCES "guestbook_messages" ("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL CHECK(length("content") BETWEEN 1 AND 1000),
    "createdAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "guestbook_parent_created_idx"
    ON "guestbook_messages" ("parentId", "createdAt", "id");

CREATE INDEX IF NOT EXISTS "guestbook_author_created_idx"
    ON "guestbook_messages" ("authorId", "createdAt");
