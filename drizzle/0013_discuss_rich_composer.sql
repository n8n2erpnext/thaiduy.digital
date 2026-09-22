ALTER TABLE "community_replies" ADD COLUMN "body_html" text;--> statement-breakpoint
ALTER TABLE "community_replies" ADD COLUMN "mentions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "community_threads" ADD COLUMN "body_html" text;--> statement-breakpoint
ALTER TABLE "community_threads" ADD COLUMN "mentions" jsonb DEFAULT '[]'::jsonb NOT NULL;