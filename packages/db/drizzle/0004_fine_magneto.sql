ALTER TABLE "databases" DROP CONSTRAINT "databases_name_unique";--> statement-breakpoint
ALTER TABLE "backup_jobs" ALTER COLUMN "size" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "migration_jobs" ALTER COLUMN "size" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "databases" ADD CONSTRAINT "databases_user_id_name_unique" UNIQUE("user_id","name");