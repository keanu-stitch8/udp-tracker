CREATE TABLE "category_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "category_groups" ADD CONSTRAINT "category_groups_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_groups_project_idx" ON "category_groups" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_group_id_category_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."category_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Backfill proyek lama (spec grup kategori): 5 grup bawaan per proyek, kategori pengeluaran diisi menurut nama bawaan;
-- "Parkir" lama → Operasional; nama lain (Biaya Admin, Lain-lain, buatan sendiri) → Lain-lain.
INSERT INTO "category_groups" ("project_id", "name")
SELECT p."id", g."name" FROM "projects" p CROSS JOIN (VALUES ('Akomodasi'), ('Meal'), ('Operasional'), ('Transportation'), ('Lain-lain')) AS g("name");--> statement-breakpoint
UPDATE "categories" c SET "group_id" = cg."id"
FROM "category_groups" cg
WHERE cg."project_id" = c."project_id" AND c."kind" = 'expense' AND cg."name" = CASE
  WHEN c."name" = 'Sarapan' THEN 'Akomodasi'
  WHEN c."name" IN ('Makan Siang', 'Makan Malam') THEN 'Meal'
  WHEN c."name" IN ('Bensin Harian', 'Snack & Air Minum', 'Parkir', 'Parkir Harian') THEN 'Operasional'
  WHEN c."name" IN ('BBM Perjalanan', 'Tol', 'Parkir Perjalanan') THEN 'Transportation'
  ELSE 'Lain-lain'
END;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_group_by_kind" CHECK (("categories"."kind" = 'expense') = ("categories"."group_id" is not null));