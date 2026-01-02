ALTER TABLE `notifications` ADD `filter_id` int;--> statement-breakpoint
CREATE INDEX `filter_id_idx` ON `notifications` (`filter_id`);