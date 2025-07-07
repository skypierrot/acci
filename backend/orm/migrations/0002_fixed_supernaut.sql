ALTER TABLE "occurrence_report" ADD COLUMN "work_permit_required" varchar(50);--> statement-breakpoint
ALTER TABLE "occurrence_report" ADD COLUMN "work_permit_number" varchar(100);--> statement-breakpoint
ALTER TABLE "occurrence_report" ADD COLUMN "work_permit_status" varchar(50);--> statement-breakpoint
ALTER TABLE "property_damage" ADD COLUMN "damage_type" varchar(255);--> statement-breakpoint
ALTER TABLE "property_damage" ADD COLUMN "recovery_plan" text;--> statement-breakpoint
ALTER TABLE "property_damage" ADD COLUMN "etc_notes" text;