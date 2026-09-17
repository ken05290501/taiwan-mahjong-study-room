CREATE TABLE `member_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` integer NOT NULL,
	`mode` text NOT NULL,
	`outcome` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`points_delta` integer DEFAULT 0 NOT NULL,
	`round_label` text DEFAULT '' NOT NULL,
	`played_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nickname` text NOT NULL,
	`nickname_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_nickname_key_unique` ON `members` (`nickname_key`);