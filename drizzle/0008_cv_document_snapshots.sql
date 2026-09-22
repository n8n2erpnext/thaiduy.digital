CREATE TABLE "cv_snapshots" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"locale" varchar(2) NOT NULL,
	"content_version" varchar(32) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"content" jsonb NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text
);
--> statement-breakpoint
CREATE INDEX "cv_snapshots_issued_idx" ON "cv_snapshots" USING btree ("issued_at");--> statement-breakpoint
CREATE INDEX "cv_snapshots_hash_idx" ON "cv_snapshots" USING btree ("content_hash");