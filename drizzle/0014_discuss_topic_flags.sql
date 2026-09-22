ALTER TABLE "community_threads" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "community_threads" ADD COLUMN "locked" boolean DEFAULT false NOT NULL;