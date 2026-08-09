CREATE TABLE "job_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"queue" text NOT NULL,
	"user_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 1 NOT NULL,
	"stalls" integer DEFAULT 0 NOT NULL,
	"locked_by" text,
	"locked_at" timestamp with time zone,
	"heartbeat_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "backup_schedules" ADD COLUMN "next_run_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job_queue" ADD CONSTRAINT "job_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_queue_claim_idx" ON "job_queue" USING btree ("queue","run_at") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "job_queue_reap_idx" ON "job_queue" USING btree ("heartbeat_at") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "job_queue_user_idx" ON "job_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "backup_schedules_due_idx" ON "backup_schedules" USING btree ("next_run_at") WHERE enabled;--> statement-breakpoint
CREATE OR REPLACE FUNCTION job_queue_notify() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('pgbr_jobs', NEW.queue);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER job_queue_notify_insert AFTER INSERT ON "job_queue" FOR EACH ROW WHEN (NEW.status = 'pending') EXECUTE FUNCTION job_queue_notify();--> statement-breakpoint
CREATE TRIGGER job_queue_notify_requeue AFTER UPDATE ON "job_queue" FOR EACH ROW WHEN (NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending') EXECUTE FUNCTION job_queue_notify();