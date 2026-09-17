CREATE TABLE `shared_rules` (
	`id` integer PRIMARY KEY NOT NULL,
	`rules_json` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `member_rounds` ADD `hand_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `member_rounds` ADD `melds_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `member_rounds` ADD `breakdown_json` text DEFAULT '[]' NOT NULL;