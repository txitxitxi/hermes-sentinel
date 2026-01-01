CREATE TABLE `monitoring_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`region_id` int NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_region_unique` UNIQUE(`user_id`,`region_id`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`region_id` int NOT NULL,
	`status` enum('success','failed','blocked') NOT NULL,
	`products_found` int NOT NULL DEFAULT 0,
	`new_restocks` int NOT NULL DEFAULT 0,
	`duration` int NOT NULL,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monitoring_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`product_id` int NOT NULL,
	`restock_id` int NOT NULL,
	`channel` enum('email','push') NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`sent_at` timestamp,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`image_url` varchar(500),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `product_filters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`category_id` int,
	`colors` text,
	`sizes` text,
	`min_price` decimal(10,2),
	`max_price` decimal(10,2),
	`keywords` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_filters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`region_id` int NOT NULL,
	`category_id` int,
	`external_id` varchar(255),
	`name` varchar(500) NOT NULL,
	`description` text,
	`price` decimal(10,2),
	`currency` varchar(3),
	`color` varchar(100),
	`size` varchar(50),
	`image_url` varchar(1000),
	`product_url` varchar(1000) NOT NULL,
	`is_available` boolean NOT NULL DEFAULT true,
	`last_seen_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`url` varchar(500) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regions_id` PRIMARY KEY(`id`),
	CONSTRAINT `regions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `restock_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`detected_at` timestamp NOT NULL DEFAULT (now()),
	`price` decimal(10,2),
	`was_notified` boolean NOT NULL DEFAULT false,
	`notification_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `restock_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`duration_days` int NOT NULL,
	`features` text NOT NULL,
	`max_regions` int NOT NULL DEFAULT 1,
	`max_products` int NOT NULL DEFAULT 5,
	`notification_channels` text NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`status` enum('trial','active','expired','cancelled') NOT NULL DEFAULT 'trial',
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`auto_renew` boolean NOT NULL DEFAULT false,
	`payment_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `monitoring_configs` (`user_id`);--> statement-breakpoint
CREATE INDEX `region_id_idx` ON `monitoring_logs` (`region_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `monitoring_logs` (`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `monitoring_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `notifications` (`status`);--> statement-breakpoint
CREATE INDEX `restock_id_idx` ON `notifications` (`restock_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `product_filters` (`user_id`);--> statement-breakpoint
CREATE INDEX `region_id_idx` ON `products` (`region_id`);--> statement-breakpoint
CREATE INDEX `category_id_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `is_available_idx` ON `products` (`is_available`);--> statement-breakpoint
CREATE INDEX `external_id_idx` ON `products` (`external_id`);--> statement-breakpoint
CREATE INDEX `product_id_idx` ON `restock_history` (`product_id`);--> statement-breakpoint
CREATE INDEX `detected_at_idx` ON `restock_history` (`detected_at`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `subscriptions` (`status`);