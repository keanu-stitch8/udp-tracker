-- Login password dibuang (spec akses multi-divisi §1): login lewat Google, rate limit per IP tidak diperlukan lagi.
ALTER TABLE "login_attempts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "login_attempts" CASCADE;--> statement-breakpoint
ALTER TABLE "google_credentials" DROP CONSTRAINT "google_credentials_userId_unique";--> statement-breakpoint
-- Kolom id lama memegang primary key; buang dulu sebelum user_id jadi primary key.
ALTER TABLE "google_credentials" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "google_credentials" ADD PRIMARY KEY ("user_id");
