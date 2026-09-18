ALTER TABLE "music_sensor_devices" RENAME TO "hub_devices";--> statement-breakpoint
DROP INDEX "music_sensor_devices_token_uq";--> statement-breakpoint
DROP INDEX "music_sensor_devices_enabled_idx";--> statement-breakpoint
ALTER TABLE "hub_devices" ADD COLUMN "scopes" jsonb DEFAULT '["music:sensor:write"]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "hub_devices_token_uq" ON "hub_devices" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "hub_devices_enabled_idx" ON "hub_devices" USING btree ("enabled","revoked_at");