CREATE TABLE "backup_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"database_id" text NOT NULL,
	"name" text NOT NULL,
	"cron_expression" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"flags" jsonb NOT NULL,
	"keep_last" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "backup_jobs" ADD COLUMN "schedule_id" text;--> statement-breakpoint
ALTER TABLE "backup_schedules" ADD CONSTRAINT "backup_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_schedules" ADD CONSTRAINT "backup_schedules_database_id_databases_id_fk" FOREIGN KEY ("database_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_jobs" ADD CONSTRAINT "backup_jobs_schedule_id_backup_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."backup_schedules"("id") ON DELETE set null ON UPDATE no action;