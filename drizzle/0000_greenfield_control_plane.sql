CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" varchar(160) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"public_url" text,
	"alt_en" text,
	"alt_vi" text,
	"status" varchar(16) DEFAULT 'ready' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"actor_id" varchar(128),
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64),
	"entity_id" varchar(160),
	"request_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brain_memory" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "brain_memory_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"brain_key" varchar(128) NOT NULL,
	"hemisphere" varchar(16) NOT NULL,
	"memory_key" varchar(220) NOT NULL,
	"value" jsonb NOT NULL,
	"confidence" double precision DEFAULT 0 NOT NULL,
	"learned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "brain_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brain_key" varchar(128) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"left_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"right_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cortex_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"memory_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description_en" text,
	"description_vi" text,
	"updated_by" varchar(128),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" varchar(160) NOT NULL,
	"action" varchar(32) NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"actor_id" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runtime_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registry_key" varchar(128) NOT NULL,
	"source" varchar(128) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"public_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(128) NOT NULL,
	"kind" varchar(32) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"parent_key" varchar(128),
	"label_en" text NOT NULL,
	"label_vi" text NOT NULL,
	"title_en" text,
	"title_vi" text,
	"summary_en" text,
	"summary_vi" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"runtime_key" varchar(128),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" varchar(128),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "traffic_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"session_id" uuid NOT NULL,
	"visit_id" uuid NOT NULL,
	"type" varchar(24) NOT NULL,
	"name" varchar(160),
	"path" text NOT NULL,
	"query" text,
	"title" text,
	"referrer_domain" text,
	"country" varchar(8),
	"language" varchar(32),
	"browser" varchar(80),
	"os" varchar(80),
	"device" varchar(40),
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"lcp" double precision,
	"inp" double precision,
	"cls" double precision,
	"fcp" double precision,
	"ttfb" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_at" timestamp with time zone DEFAULT now() NOT NULL,
	"landing_path" text NOT NULL,
	"referrer_domain" text,
	"country" varchar(8),
	"language" varchar(32),
	"browser" varchar(80),
	"os" varchar(80),
	"device" varchar(40),
	"visits" integer DEFAULT 1 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"events" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assets_storage_key_uq" ON "assets" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "assets_status_idx" ON "assets" USING btree ("status","deleted_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brain_memory_key_uq" ON "brain_memory" USING btree ("brain_key","hemisphere","memory_key");--> statement-breakpoint
CREATE INDEX "brain_memory_lookup_idx" ON "brain_memory" USING btree ("brain_key","hemisphere","learned_at");--> statement-breakpoint
CREATE UNIQUE INDEX "brain_profiles_key_uq" ON "brain_profiles" USING btree ("brain_key");--> statement-breakpoint
CREATE INDEX "revisions_entity_idx" ON "revisions" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "runtime_binding_source_uq" ON "runtime_bindings" USING btree ("registry_key","source");--> statement-breakpoint
CREATE INDEX "runtime_binding_enabled_idx" ON "runtime_bindings" USING btree ("enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "site_registry_key_uq" ON "site_registry" USING btree ("key");--> statement-breakpoint
CREATE INDEX "site_registry_public_idx" ON "site_registry" USING btree ("kind","enabled","status","sort");--> statement-breakpoint
CREATE INDEX "traffic_events_created_idx" ON "traffic_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "traffic_events_session_idx" ON "traffic_events" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "traffic_events_visit_idx" ON "traffic_events" USING btree ("visit_id","created_at");--> statement-breakpoint
CREATE INDEX "traffic_events_path_idx" ON "traffic_events" USING btree ("path","created_at");--> statement-breakpoint
CREATE INDEX "traffic_events_name_idx" ON "traffic_events" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "traffic_sessions_last_idx" ON "traffic_sessions" USING btree ("last_at");--> statement-breakpoint
CREATE INDEX "traffic_sessions_country_idx" ON "traffic_sessions" USING btree ("country");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");