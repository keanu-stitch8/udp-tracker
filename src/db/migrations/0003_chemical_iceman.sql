ALTER TABLE "budgets" ADD COLUMN "days" integer;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_days_positive" CHECK ("budgets"."days" >= 1);