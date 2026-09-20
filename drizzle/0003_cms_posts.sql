CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"title_en" text DEFAULT '' NOT NULL,
	"title_vi" text DEFAULT '' NOT NULL,
	"excerpt_en" text,
	"excerpt_vi" text,
	"body_en" text DEFAULT '' NOT NULL,
	"body_vi" text DEFAULT '' NOT NULL,
	"cover_asset_id" uuid,
	"seo_title_en" text,
	"seo_title_vi" text,
	"seo_description_en" text,
	"seo_description_vi" text,
	"author_id" varchar(128),
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_asset_id_assets_id_fk" FOREIGN KEY ("cover_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_uq" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status","deleted_at","published_at");