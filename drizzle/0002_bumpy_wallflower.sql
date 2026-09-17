CREATE TABLE `shared_highlights` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` integer NOT NULL,
	`mode` text NOT NULL,
	`round_label` text NOT NULL,
	`win_label` text NOT NULL,
	`outcome_label` text NOT NULL,
	`hand_json` text NOT NULL,
	`winning_tile` integer,
	`melds_json` text NOT NULL,
	`flowers_json` text NOT NULL,
	`breakdown_json` text NOT NULL,
	`total_label` text NOT NULL,
	`points` integer NOT NULL,
	`shared_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_shared_highlights_shared_at` ON `shared_highlights` (`shared_at`);