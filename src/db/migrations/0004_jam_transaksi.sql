ALTER TABLE "transactions" ADD COLUMN "time" time(0);--> statement-breakpoint
UPDATE "transactions" SET "time" = date_trunc('minute', "created_at" AT TIME ZONE 'Asia/Jakarta')::time;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "time" SET NOT NULL;
