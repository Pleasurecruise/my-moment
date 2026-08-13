-- Void's Better Auth adapter maps date fields as millisecond timestamps.
-- The original schema used TEXT columns, whose affinity coerced newly written
-- timestamps to strings such as "1786609546059.0". Drizzle then parsed those
-- strings as date strings and produced Invalid Date values.

PRAGMA defer_foreign_keys = ON;

ALTER TABLE "user" RENAME TO "user_auth_text_dates";
ALTER TABLE "session" RENAME TO "session_auth_text_dates";
ALTER TABLE "account" RENAME TO "account_auth_text_dates";
ALTER TABLE "verification" RENAME TO "verification_auth_text_dates";
ALTER TABLE "guestbook_messages" RENAME TO "guestbook_messages_auth_text_dates";

CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL
);

INSERT INTO "user" (
    "id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt"
)
SELECT
    "id",
    "name",
    "email",
    "emailVerified",
    "image",
    CASE
        WHEN CAST("createdAt" AS TEXT) GLOB '*[^0-9.]*'
            THEN CAST((julianday("createdAt") - 2440587.5) * 86400000 AS INTEGER)
        ELSE CAST(CAST("createdAt" AS REAL) AS INTEGER)
    END,
    CASE
        WHEN CAST("updatedAt" AS TEXT) GLOB '*[^0-9.]*'
            THEN CAST((julianday("updatedAt") - 2440587.5) * 86400000 AS INTEGER)
        ELSE CAST(CAST("updatedAt" AS REAL) AS INTEGER)
    END
FROM "user_auth_text_dates";

CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" INTEGER NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

-- Existing session cookies are intentionally invalidated. Re-authentication
-- creates rows using the timestamp_ms representation expected by Void.

CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" INTEGER,
    "refreshTokenExpiresAt" INTEGER,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL
);

INSERT INTO "account" (
    "id", "accountId", "providerId", "userId", "accessToken", "refreshToken",
    "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "password",
    "createdAt", "updatedAt"
)
SELECT
    "id",
    "accountId",
    "providerId",
    "userId",
    "accessToken",
    "refreshToken",
    "idToken",
    CASE
        WHEN "accessTokenExpiresAt" IS NULL THEN NULL
        WHEN CAST("accessTokenExpiresAt" AS TEXT) GLOB '*[^0-9.]*'
            THEN CAST((julianday("accessTokenExpiresAt") - 2440587.5) * 86400000 AS INTEGER)
        ELSE CAST(CAST("accessTokenExpiresAt" AS REAL) AS INTEGER)
    END,
    CASE
        WHEN "refreshTokenExpiresAt" IS NULL THEN NULL
        WHEN CAST("refreshTokenExpiresAt" AS TEXT) GLOB '*[^0-9.]*'
            THEN CAST((julianday("refreshTokenExpiresAt") - 2440587.5) * 86400000 AS INTEGER)
        ELSE CAST(CAST("refreshTokenExpiresAt" AS REAL) AS INTEGER)
    END,
    "scope",
    "password",
    CASE
        WHEN CAST("createdAt" AS TEXT) GLOB '*[^0-9.]*'
            THEN CAST((julianday("createdAt") - 2440587.5) * 86400000 AS INTEGER)
        ELSE CAST(CAST("createdAt" AS REAL) AS INTEGER)
    END,
    CASE
        WHEN CAST("updatedAt" AS TEXT) GLOB '*[^0-9.]*'
            THEN CAST((julianday("updatedAt") - 2440587.5) * 86400000 AS INTEGER)
        ELSE CAST(CAST("updatedAt" AS REAL) AS INTEGER)
    END
FROM "account_auth_text_dates";

CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL
);

-- Verification rows are short-lived authentication challenges and can be
-- safely discarded during this one-time representation change.

CREATE TABLE "guestbook_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "parentId" TEXT REFERENCES "guestbook_messages" ("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL CHECK(length("content") BETWEEN 1 AND 1000),
    "createdAt" TEXT NOT NULL
);

INSERT INTO "guestbook_messages" ("id", "authorId", "parentId", "content", "createdAt")
SELECT "id", "authorId", "parentId", "content", "createdAt"
FROM "guestbook_messages_auth_text_dates";

DROP TABLE "guestbook_messages_auth_text_dates";
DROP TABLE "session_auth_text_dates";
DROP TABLE "account_auth_text_dates";
DROP TABLE "verification_auth_text_dates";
DROP TABLE "user_auth_text_dates";

CREATE INDEX "session_userId_idx" ON "session" ("userId");
CREATE INDEX "account_userId_idx" ON "account" ("userId");
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");
CREATE INDEX "guestbook_parent_created_idx"
    ON "guestbook_messages" ("parentId", "createdAt", "id");
CREATE INDEX "guestbook_author_created_idx"
    ON "guestbook_messages" ("authorId", "createdAt");
