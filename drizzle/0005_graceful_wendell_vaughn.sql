CREATE TABLE `backup_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`database_id` text,
	`database_name` text NOT NULL,
	`status` text NOT NULL,
	`backup_path` text NOT NULL,
	`flags` text NOT NULL,
	`error` text,
	`started_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`completed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`database_id`) REFERENCES `databases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `restore_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`database_id` text,
	`database_name` text NOT NULL,
	`status` text NOT NULL,
	`backup_path` text NOT NULL,
	`flags` text NOT NULL,
	`error` text,
	`started_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`database_id`) REFERENCES `databases`(`id`) ON UPDATE no action ON DELETE set null
);
