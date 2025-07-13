CREATE TABLE "annual_working_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"site_id" varchar(128),
	"year" integer NOT NULL,
	"employee_hours" integer DEFAULT 0 NOT NULL,
	"partner_on_hours" integer DEFAULT 0 NOT NULL,
	"partner_off_hours" integer DEFAULT 0 NOT NULL,
	"total_hours" integer DEFAULT 0 NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text,
	"address" varchar(255),
	"contact" varchar(50),
	CONSTRAINT "company_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "site" (
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
CREATE TABLE "file_access_logs" (
	"log_id" varchar(50) PRIMARY KEY NOT NULL,
	"file_id" varchar(50) NOT NULL,
	"access_type" varchar(20) NOT NULL,
	"user_id" varchar(50),
	"ip_address" varchar(45),
	"user_agent" text,
	"accessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "files" (
	"file_id" varchar(50) PRIMARY KEY NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"stored_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_extension" varchar(10),
	"category" varchar(50),
	"uploaded_by" varchar(50),
	"status" varchar(20) DEFAULT 'uploaded',
	"report_id" varchar(50),
	"report_type" varchar(20),
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"scheduled_delete_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "temp_file_sessions" (
	"session_id" varchar(50) PRIMARY KEY NOT NULL,
	"file_ids" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"report_type" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "accident_history" (
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
CREATE TABLE "investigation_report" (
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
	"original_weather" varchar(20),
	"investigation_weather" varchar(20),
	"original_temperature" integer,
	"investigation_temperature" integer,
	"original_humidity" integer,
	"investigation_humidity" integer,
	"original_wind_speed" integer,
	"investigation_wind_speed" integer,
	"original_weather_special" varchar(255),
	"investigation_weather_special" varchar(255),
	"original_acci_location" varchar(255),
	"investigation_acci_location" varchar(255),
	"original_accident_type_level1" varchar(20),
	"investigation_accident_type_level1" varchar(20),
	"original_accident_type_level2" varchar(50),
	"investigation_accident_type_level2" varchar(50),
	"original_accident_name" varchar(255),
	"investigation_accident_name" varchar(255),
	"original_acci_summary" text,
	"investigation_acci_summary" text,
	"original_acci_detail" text,
	"investigation_acci_detail" text,
	"original_victim_count" integer,
	"investigation_victim_count" integer,
	"investigation_victims_json" text,
	"damage_cost" integer,
	"direct_cause" text,
	"root_cause" text,
	"corrective_actions" text,
	"action_schedule" varchar(255),
	"action_verifier" varchar(100),
	"investigation_conclusion" text,
	"investigation_status" varchar(50),
	"investigation_summary" text,
	"investigator_signature" varchar(100),
	"report_written_date" timestamp,
	"cause_analysis" text,
	"prevention_actions" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "occurrence_report" (
	"accident_id" varchar(50) PRIMARY KEY NOT NULL,
	"global_accident_no" varchar(50),
	"acci_time" timestamp,
	"company_name" varchar(100),
	"site_name" varchar(100),
	"accident_name" varchar(255),
	"acci_location" varchar(255),
	"is_contractor" boolean DEFAULT false,
	"victim_count" integer DEFAULT 0,
	"accident_type_level1" varchar(50),
	"accident_type_level2" varchar(50),
	"acci_summary" text,
	"acci_detail" text,
	"scene_photos" text,
	"cctv_video" text,
	"statement_docs" text,
	"etc_documents" text,
	"first_report_time" timestamp,
	"report_channel" varchar(50),
	"report_channel_no" varchar(50),
	"company_code" varchar(20),
	"site_code" varchar(20),
	"work_related_type" varchar(20),
	"misc_classification" varchar(50),
	"victims_json" text,
	"contractor_name" varchar(100),
	"reporter_name" varchar(100),
	"reporter_position" varchar(100),
	"reporter_belong" varchar(100),
	"work_permit_required" varchar(50),
	"work_permit_number" varchar(100),
	"work_permit_status" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"attachments" text
);
--> statement-breakpoint
CREATE TABLE "occurrence_sequence" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_code" varchar(20) NOT NULL,
	"site_code" varchar(20),
	"year" integer NOT NULL,
	"type" varchar(10) DEFAULT 'site' NOT NULL,
	"current_seq" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_damage" (
	"damage_id" serial PRIMARY KEY NOT NULL,
	"accident_id" varchar(50) NOT NULL,
	"damage_target" varchar(255),
	"damage_type" varchar(255),
	"estimated_cost" bigint,
	"damage_content" text,
	"recovery_plan" text,
	"etc_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_form_settings" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"report_type" varchar(20) NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"is_visible" boolean DEFAULT true,
	"is_required" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"field_group" varchar(50),
	"display_name" varchar(100),
	"description" text,
	"grid_layout" jsonb DEFAULT '{"x":0,"y":0,"w":1,"h":1}'::jsonb,
	"layout_template" varchar(50) DEFAULT 'compact',
	"group_cols" integer DEFAULT 2,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "victims" (
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
	"injury_location" varchar(200),
	"medical_opinion" text,
	"training_completed" varchar(50),
	"etc_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "site" ADD CONSTRAINT "site_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_property_damage" ADD CONSTRAINT "investigation_property_damage_accident_id_investigation_report_accident_id_fk" FOREIGN KEY ("accident_id") REFERENCES "public"."investigation_report"("accident_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_victims" ADD CONSTRAINT "investigation_victims_accident_id_investigation_report_accident_id_fk" FOREIGN KEY ("accident_id") REFERENCES "public"."investigation_report"("accident_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_report" ADD CONSTRAINT "investigation_report_accident_id_occurrence_report_accident_id_fk" FOREIGN KEY ("accident_id") REFERENCES "public"."occurrence_report"("accident_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_damage" ADD CONSTRAINT "property_damage_accident_id_occurrence_report_accident_id_fk" FOREIGN KEY ("accident_id") REFERENCES "public"."occurrence_report"("accident_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "victims" ADD CONSTRAINT "victims_accident_id_occurrence_report_accident_id_fk" FOREIGN KEY ("accident_id") REFERENCES "public"."occurrence_report"("accident_id") ON DELETE cascade ON UPDATE no action;