ALTER TABLE "assets" ADD COLUMN "source" varchar(24) DEFAULT 'upload' NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "credit_name" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "credit_url" text;