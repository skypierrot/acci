CREATE TABLE "occurrence_sequence" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_code" varchar(20) NOT NULL,
	"site_code" varchar(20),
	"year" integer NOT NULL,
	"type" varchar(10) DEFAULT 'site' NOT NULL,
	"current_seq" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "temp_file_sessions" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "temp_file_sessions" ALTER COLUMN "status" SET DEFAULT 'active';