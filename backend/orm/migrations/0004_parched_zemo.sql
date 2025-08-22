ALTER TABLE "investigation_victims" ADD COLUMN "is_contractor" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "victims" ADD COLUMN "is_contractor" boolean DEFAULT false;