ALTER TABLE `restore_jobs` ADD `created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL;--> statement-breakpoint
ALTER TABLE `restore_jobs` ADD `updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL;