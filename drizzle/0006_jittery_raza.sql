ALTER TABLE `backup_jobs` ADD `user_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `restore_jobs` ADD `user_id` text REFERENCES databases(id);