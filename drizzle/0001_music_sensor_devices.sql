CREATE TABLE "music_sensor_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(96) NOT NULL,
	"platform" varchar(24) DEFAULT 'android' NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "music_sensor_devices_token_uq" ON "music_sensor_devices" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "music_sensor_devices_enabled_idx" ON "music_sensor_devices" USING btree ("enabled","revoked_at");