CREATE TABLE "community_members" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"note" text,
	"blocked_by" text,
	"blocked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"moderated_by" text,
	"moderated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(180) NOT NULL,
	"body" text NOT NULL,
	"locale" varchar(2) DEFAULT 'en' NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"moderated_by" text,
	"moderated_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_thread_id_community_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."community_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_threads" ADD CONSTRAINT "community_threads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_members_status_idx" ON "community_members" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "community_replies_thread_status_idx" ON "community_replies" USING btree ("thread_id","status","created_at");--> statement-breakpoint
CREATE INDEX "community_replies_user_idx" ON "community_replies" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "community_threads_status_idx" ON "community_threads" USING btree ("status","last_activity_at");--> statement-breakpoint
CREATE INDEX "community_threads_user_idx" ON "community_threads" USING btree ("user_id","created_at");