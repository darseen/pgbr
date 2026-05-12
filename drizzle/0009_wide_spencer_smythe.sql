PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_restore_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`database_id` text,
	`database_name` text NOT NULL,
	`status` text NOT NULL,
	`user_id` text,
	`backup_path` text NOT NULL,
	`flags` text NOT NULL,
	`error` text,
	`started_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`completed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`database_id`) REFERENCES `databases`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_restore_jobs`("id", "database_id", "database_name", "status", "user_id", "backup_path", "flags", "error", "started_at", "completed_at", "created_at", "updated_at") SELECT "id", "database_id", "database_name", "status", "user_id", "backup_path", "flags", "error", "started_at", "completed_at", "created_at", "updated_at" FROM `restore_jobs`;--> statement-breakpoint
DROP TABLE `restore_jobs`;--> statement-breakpoint
ALTER TABLE `__new_restore_jobs` RENAME TO `restore_jobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;