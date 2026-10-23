CREATE TYPE "public"."holder_revoke_reason" AS ENUM('revoked', 'removed', 'rejected');--> statement-breakpoint
ALTER TABLE "wallet_holders" DROP CONSTRAINT "wallet_holders_wallet_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "wallet_holders" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_holders" ADD COLUMN "assigned_by" uuid;--> statement-breakpoint
ALTER TABLE "wallet_holders" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "wallet_holders" ADD COLUMN "revoked_by" uuid;--> statement-breakpoint
ALTER TABLE "wallet_holders" ADD COLUMN "revoke_reason" "holder_revoke_reason";--> statement-breakpoint
ALTER TABLE "wallet_holders" ADD CONSTRAINT "wallet_holders_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_holders" ADD CONSTRAINT "wallet_holders_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_holders_active_idx" ON "wallet_holders" USING btree ("wallet_id","user_id") WHERE "wallet_holders"."revoked_at" is null;