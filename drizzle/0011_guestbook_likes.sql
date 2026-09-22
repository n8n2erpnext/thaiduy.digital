CREATE TABLE "community_reply_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reply_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_thread_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_reply_likes" ADD CONSTRAINT "community_reply_likes_reply_id_community_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."community_replies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_reply_likes" ADD CONSTRAINT "community_reply_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_thread_likes" ADD CONSTRAINT "community_thread_likes_thread_id_community_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."community_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_thread_likes" ADD CONSTRAINT "community_thread_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "community_reply_likes_uq" ON "community_reply_likes" USING btree ("reply_id","user_id");--> statement-breakpoint
CREATE INDEX "community_reply_likes_reply_idx" ON "community_reply_likes" USING btree ("reply_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "community_thread_likes_uq" ON "community_thread_likes" USING btree ("thread_id","user_id");--> statement-breakpoint
CREATE INDEX "community_thread_likes_thread_idx" ON "community_thread_likes" USING btree ("thread_id","created_at");