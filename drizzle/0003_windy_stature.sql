CREATE TABLE `scan_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`region_id` int NOT NULL,
	`status` enum('success','failed') NOT NULL,
	`products_found` int DEFAULT 0,
	`new_restocks` int DEFAULT 0,
	`duration` int NOT NULL,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scan_logs_id` PRIMARY KEY(`id`)
);
