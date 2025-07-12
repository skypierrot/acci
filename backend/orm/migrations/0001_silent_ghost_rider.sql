CREATE TABLE "investigation_property_damage" (
	"damage_id" serial PRIMARY KEY NOT NULL,
	"accident_id" varchar(50) NOT NULL,
	"damage_target" varchar(255),
	"estimated_cost" integer,
	"damage_content" text,
	"shutdown_start_date" timestamp,
	"recovery_expected_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "investigation_victims" (
	"victim_id" serial PRIMARY KEY NOT NULL,
	"accident_id" varchar(50) NOT NULL,
	"name" varchar(50),
	"age" integer,
	"belong" varchar(100),
	"duty" varchar(100),
	"injury_type" varchar(100),
	"ppe_worn" varchar(50),
	"first_aid" varchar(50),
	"birth_date" varchar(20),
	"absence_start_date" varchar(20),
	"return_expected_date" varchar(20),
	"job_experience_duration" integer,
	"job_experience_unit" varchar(20),
	"injury_location" varchar(100),
	"medical_opinion" text,
	"training_completed" varchar(20),
	"etc_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "investigation_property_damage" ADD CONSTRAINT "investigation_property_damage_accident_id_investigation_report_accident_id_fk" FOREIGN KEY ("accident_id") REFERENCES "public"."investigation_report"("accident_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_victims" ADD CONSTRAINT "investigation_victims_accident_id_investigation_report_accident_id_fk" FOREIGN KEY ("accident_id") REFERENCES "public"."investigation_report"("accident_id") ON DELETE cascade ON UPDATE no action;