CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `budgetTier` enum('economy','mid-range','premium','luxury');--> statement-breakpoint
ALTER TABLE `products` ADD `stock` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `views` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `featured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `mpesaTransactionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `businessWebsite` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `businessVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `businessRating` decimal(3,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` ADD `totalSales` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `videoAnalyses` ADD `userSelectedRoomType` varchar(100);--> statement-breakpoint
ALTER TABLE `videoAnalyses` ADD `budgetTier` enum('economy','mid-range','premium','luxury');--> statement-breakpoint
ALTER TABLE `videoAnalyses` ADD `transformedImageEconomy` text;--> statement-breakpoint
ALTER TABLE `videoAnalyses` ADD `transformedImageMidRange` text;--> statement-breakpoint
ALTER TABLE `videoAnalyses` ADD `transformedImagePremium` text;--> statement-breakpoint
ALTER TABLE `videoAnalyses` ADD `transformedImageLuxury` text;