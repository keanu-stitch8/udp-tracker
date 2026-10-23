ALTER TABLE "budgets" ADD COLUMN "employee_rate" integer;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_employee_rate_nonnegative" CHECK ("budgets"."employee_rate" >= 0);