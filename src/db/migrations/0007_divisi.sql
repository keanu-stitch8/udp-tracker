CREATE TABLE "divisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Divisi bawaan: DB baru selalu punya satu divisi, proyek lama masuk ke sana (nama diganti pengguna di UI).
INSERT INTO "divisions" ("name") VALUES ('Umum');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "division_id" uuid;--> statement-breakpoint
UPDATE "projects" SET "division_id" = (SELECT "id" FROM "divisions" LIMIT 1);--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "division_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_division_idx" ON "projects" USING btree ("division_id");