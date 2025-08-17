CREATE TABLE "cause_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"investigation_id" varchar(50) NOT NULL,
	"cause_type" varchar(20) NOT NULL,
	"cause_category" varchar(50),
	"cause_title" varchar(255),
	"cause_description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prevention_action" (
	"id" serial PRIMARY KEY NOT NULL,
	"investigation_id" varchar(50) NOT NULL,
	"action_type" varchar(20) NOT NULL,
	"action_category" varchar(50),
	"action_title" varchar(255),
	"action_description" text,
	"priority" varchar(20),
	"responsible_person" varchar(100),
	"target_date" varchar(20),
	"status" varchar(20) DEFAULT 'planned',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
