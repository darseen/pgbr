CREATE TABLE "storage_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"endpoint" text NOT NULL,
	"region" text NOT NULL,
	"bucket" text NOT NULL,
	"access_key_id" text NOT NULL,
	"secret_access_key" text NOT NULL,
	"force_path_style" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "backup_jobs" ADD COLUMN "storage_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "restore_jobs" ADD COLUMN "storage_key" text NOT NULL;