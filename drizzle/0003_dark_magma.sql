CREATE TABLE `leaderboards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`mode` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`locked_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_leaderboards_mode_status` ON `leaderboards` (`mode`,`status`);--> statement-breakpoint
ALTER TABLE `member_rounds` ADD `leaderboard_id` integer REFERENCES leaderboards(id);--> statement-breakpoint
ALTER TABLE `member_rounds` ADD `rules_version` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `member_rounds` ADD `rules_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_member_rounds_board_mode` ON `member_rounds` (`leaderboard_id`,`mode`);--> statement-breakpoint
CREATE INDEX `idx_member_rounds_member_board` ON `member_rounds` (`member_id`,`leaderboard_id`);