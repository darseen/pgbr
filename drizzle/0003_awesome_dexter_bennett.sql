PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_databases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text(255) NOT NULL,
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
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text(25) NOT NULL,
	`password_hash` text(255) NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "password_hash", "created_at", "updated_at") SELECT "id", "username", "password_hash", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);