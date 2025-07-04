-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "file_access_logs" (
	"log_id" varchar(50) PRIMARY KEY NOT NULL,
	"file_id" varchar(50) NOT NULL,
	"access_type" varchar(20) NOT NULL,
	"user_id" varchar(50),
	"ip_address" varchar(45),
	"user_agent" text,
	"accessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"file_id" varchar(50) PRIMARY KEY NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"stored_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_extension" varchar(10),
	"category" varchar(50),
	"uploaded_by" varchar(50),
	"status" varchar(20) DEFAULT 'uploaded'::character varying,
	"report_id" varchar(50),
	"report_type" varchar(20),
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"scheduled_delete_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text,
	"address" varchar(255),
	"contact" varchar(50),
	CONSTRAINT "company_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "temp_file_sessions" (
	"session_id" varchar(50) PRIMARY KEY NOT NULL,
	"file_ids" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'active'::character varying,
	"report_type" varchar(20)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accident_history" (
	"accident_id" varchar(50) PRIMARY KEY NOT NULL,
	"company_name" varchar(100),
	"site_name" varchar(100),
	"acci_time" timestamp,
	"acci_location" varchar(255),
	"is_contractor" boolean,
	"victim_belong" varchar(100),
	"accident_type_level1" varchar(20),
	"accident_type_level2" varchar(50),
	"death_count" integer,
	"injured_count" integer,
	"damage_cost" integer,
	"damage_severity" varchar(20),
	"misc_classification" varchar(50),
	"acci_summary" text,
	"direct_cause" text,
	"root_cause" text,
	"injury_location_detail" varchar(100),
	"corrective_actions" text,
	"victim_return_date" timestamp,
	"investigation_status" varchar(20),
	"investigation_start_time" timestamp,
	"investigation_end_time" timestamp,
	"investigator_signature" varchar(100),
	"legal_report_flag" varchar(20)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_form_settings" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"report_type" varchar(20) NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"is_visible" boolean DEFAULT true,
	"is_required" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"field_group" varchar(50),
	"display_name" varchar(100),
	"description" text,
	"grid_layout" jsonb DEFAULT '{"h":1,"w":1,"x":0,"y":0}'::jsonb,
	"layout_template" varchar(50) DEFAULT 'compact'::character varying,
	"group_cols" integer DEFAULT 2,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text,
	"address" varchar(255),
	"contact" varchar(50),
	CONSTRAINT "site_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "occurrence_report" (
	"accident_id" varchar(50) PRIMARY KEY NOT NULL,
	"global_accident_no" varchar(50),
	"acci_time" timestamp,
	"company_name" varchar(100),
	"site_name" varchar(100),
	"acci_location" varchar(255),
	"is_contractor" boolean,
	"victim_count" integer,
	"accident_type_level1" varchar(20),
	"accident_type_level2" varchar(50),
	"acci_summary" text,
	"acci_detail" text,
	"scene_photos" text,
	"cctv_video" text,
	"statement_docs" text,
	"etc_documents" text,
	"first_report_time" timestamp,
	"report_channel" varchar(50),
	"company_code" varchar(20),
	"site_code" varchar(20),
	"work_related_type" varchar(20),
	"misc_classification" varchar(50),
	"victims_json" text,
	"contractor_name" varchar(100),
	"reporter_name" varchar(100),
	"reporter_position" varchar(100),
	"reporter_belong" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investigation_report" (
	"accident_id" varchar(50) PRIMARY KEY NOT NULL,
	"investigation_start_time" timestamp,
	"investigation_end_time" timestamp,
	"investigation_team_lead" varchar(100),
	"investigation_team_members" text,
	"investigation_location" varchar(255),
	"original_global_accident_no" varchar(50),
	"investigation_global_accident_no" varchar(50),
	"original_accident_id" varchar(50),
	"investigation_accident_id" varchar(50),
	"original_acci_time" timestamp,
	"investigation_acci_time" timestamp,
	"original_acci_location" varchar(255),
	"investigation_acci_location" varchar(255),
	"original_accident_type_level1" varchar(20),
	"investigation_accident_type_level1" varchar(20),
	"original_accident_type_level2" varchar(50),
	"investigation_accident_type_level2" varchar(50),
	"original_acci_summary" text,
	"investigation_acci_summary" text,
	"original_acci_detail" text,
	"investigation_acci_detail" text,
	"original_victim_count" integer,
	"investigation_victim_count" integer,
	"original_victim_name_1" varchar(100),
	"investigation_victim_name_1" varchar(100),
	"original_victim_age_1" integer,
	"investigation_victim_age_1" integer,
	"original_victim_belong_1" varchar(100),
	"investigation_victim_belong_1" varchar(100),
	"original_is_contractor_1" varchar(10),
	"investigation_is_contractor_1" varchar(10),
	"original_contractor_name_1" varchar(100),
	"investigation_contractor_name_1" varchar(100),
	"original_victim_duty_1" varchar(100),
	"investigation_victim_duty_1" varchar(100),
	"original_injury_type_1" varchar(50),
	"investigation_injury_type_1" varchar(50),
	"original_ppe_worn_1" varchar(50),
	"investigation_ppe_worn_1" varchar(50),
	"original_first_aid_1" text,
	"investigation_first_aid_1" text,
	"investigation_scene_photos" text,
	"investigation_statement_docs" text,
	"investigation_etc_documents" text,
	"investigation_first_report_time" timestamp,
	"investigation_report_channel" varchar(50),
	"investigation_work_related_type" varchar(20),
	"damage_severity" varchar(20),
	"death_count" integer,
	"injured_count" integer,
	"damage_cost" integer,
	"injury_location_detail" varchar(100),
	"victim_return_date" timestamp,
	"direct_cause" text,
	"root_cause" text,
	"corrective_actions" text,
	"action_schedule" varchar(100),
	"action_verifier" varchar(100),
	"investigation_photos" text,
	"equipment_inspection_report" text,
	"witness_statements" text,
	"incident_flow_diagram" text,
	"investigation_conclusion" text,
	"investigator_signature" varchar(100),
	"report_written_date" timestamp,
	"investigation_status" varchar(20),
	"investigation_summary" text,
	"investigation_report_link" varchar(255),
	"legal_report_flag" varchar(20),
	"ra_number" varchar(50),
	"insurance_status" varchar(50),
	"training_action_history" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "victims" (
	"victim_id" serial PRIMARY KEY NOT NULL,
	"accident_id" varchar(50) NOT NULL,
	"name" varchar(100),
	"age" integer,
	"belong" varchar(100),
	"duty" varchar(100),
	"injury_type" varchar(100),
	"ppe_worn" varchar(100),
	"first_aid" text,
	"birth_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "site" ADD CONSTRAINT "site_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investigation_report" ADD CONSTRAINT "investigation_report_accident_id_occurrence_report_accident_id_" FOREIGN KEY ("accident_id") REFERENCES "public"."occurrence_report"("accident_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "victims" ADD CONSTRAINT "victims_accident_id_occurrence_report_accident_id_fk" FOREIGN KEY ("accident_id") REFERENCES "public"."occurrence_report"("accident_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/