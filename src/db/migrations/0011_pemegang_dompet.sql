CREATE TABLE "wallet_holders" (
	"wallet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_holders_wallet_id_user_id_pk" PRIMARY KEY("wallet_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "wallet_holders" ADD CONSTRAINT "wallet_holders_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_holders" ADD CONSTRAINT "wallet_holders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallet_holders_user_idx" ON "wallet_holders" USING btree ("user_id");