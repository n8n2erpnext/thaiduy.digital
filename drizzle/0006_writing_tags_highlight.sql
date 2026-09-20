ALTER TABLE "posts" ADD COLUMN "highlight" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;