PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_databases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_databases`("id", "user_id", "name", "url", "created_at", "updated_at") SELECT "id", "user_id", "name", "url", "created_at", "updated_at" FROM `databases`;--> statement-breakpoint
DROP TABLE `databases`;--> statement-breakpoint
ALTER TABLE `__new_databases` RENAME TO `databases`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `databases_name_unique` ON `databases` (`name`);