CREATE TABLE "writing_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(64) NOT NULL,
	"color" varchar(7) DEFAULT '#dfe8e2' NOT NULL,
	"text_color" varchar(7) DEFAULT '#172019' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "writing_tags_slug_uq" ON "writing_tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "writing_tags_enabled_idx" ON "writing_tags" USING btree ("enabled","name");
--> statement-breakpoint
INSERT INTO "writing_tags" ("slug","name","color","text_color")
SELECT DISTINCT
  trim(both '-' from regexp_replace(lower(trim(tag_value)), '[^a-z0-9]+', '-', 'g')) AS slug,
  trim(tag_value) AS name,
  CASE lower(trim(tag_value))
    WHEN 'architecture' THEN '#D6F0E0'
    WHEN 'stack' THEN '#D9E8FA'
    WHEN 'systems' THEN '#E9DDF7'
    ELSE '#E4EBE6'
  END AS color,
  CASE lower(trim(tag_value))
    WHEN 'architecture' THEN '#24553A'
    WHEN 'stack' THEN '#254D75'
    WHEN 'systems' THEN '#563C73'
    ELSE '#314239'
  END AS text_color
FROM "posts", LATERAL jsonb_array_elements_text("posts"."tags") AS existing_tags(tag_value)
WHERE trim(tag_value) <> ''
  AND trim(both '-' from regexp_replace(lower(trim(tag_value)), '[^a-z0-9]+', '-', 'g')) <> ''
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
UPDATE "posts" AS p
SET "tags" = COALESCE(
  (
    SELECT jsonb_agg(tag_slug ORDER BY tag_slug)
    FROM (
      SELECT DISTINCT trim(both '-' from regexp_replace(lower(trim(tag_value)), '[^a-z0-9]+', '-', 'g')) AS tag_slug
      FROM jsonb_array_elements_text(p."tags") AS post_tags(tag_value)
      WHERE trim(tag_value) <> ''
        AND trim(both '-' from regexp_replace(lower(trim(tag_value)), '[^a-z0-9]+', '-', 'g')) <> ''
    ) normalized
  ),
  '[]'::jsonb
);
