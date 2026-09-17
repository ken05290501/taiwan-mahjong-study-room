import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nickname: text("nickname").notNull(),
  nicknameKey: text("nickname_key").notNull(),
  createdAt: integer("created_at").notNull(),
  lastSeenAt: integer("last_seen_at").notNull(),
}, table => [uniqueIndex("members_nickname_key_unique").on(table.nicknameKey)]);

export const leaderboards = sqliteTable("leaderboards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  mode: text("mode").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at").notNull(),
  lockedAt: integer("locked_at"),
}, table => [index("idx_leaderboards_mode_status").on(table.mode, table.status), uniqueIndex("leaderboards_one_active_per_mode").on(table.mode).where(sql`${table.status} = 'active'`)]);

export const memberRounds = sqliteTable("member_rounds", {
  id: text("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  leaderboardId: integer("leaderboard_id").references(() => leaderboards.id),
  mode: text("mode").notNull(),
  outcome: text("outcome").notNull(),
  score: integer("score").notNull().default(0),
  pointsDelta: integer("points_delta").notNull().default(0),
  roundLabel: text("round_label").notNull().default(""),
  handJson: text("hand_json").notNull().default("[]"),
  meldsJson: text("melds_json").notNull().default("[]"),
  breakdownJson: text("breakdown_json").notNull().default("[]"),
  rulesVersion: text("rules_version").notNull().default(""),
  rulesJson: text("rules_json").notNull().default("{}"),
  playedAt: integer("played_at").notNull(),
}, table => [index("idx_member_rounds_board_mode").on(table.leaderboardId, table.mode), index("idx_member_rounds_member_board").on(table.memberId, table.leaderboardId)]);

export const sharedRules = sqliteTable("shared_rules", {
  id: integer("id").primaryKey(),
  rulesJson: text("rules_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const sharedHighlights = sqliteTable("shared_highlights", {
  id: text("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(),
  roundLabel: text("round_label").notNull(),
  winLabel: text("win_label").notNull(),
  outcomeLabel: text("outcome_label").notNull(),
  handJson: text("hand_json").notNull(),
  winningTile: integer("winning_tile"),
  meldsJson: text("melds_json").notNull(),
  flowersJson: text("flowers_json").notNull(),
  breakdownJson: text("breakdown_json").notNull(),
  totalLabel: text("total_label").notNull(),
  points: integer("points").notNull(),
  sharedAt: integer("shared_at").notNull(),
}, table => [index("idx_shared_highlights_shared_at").on(table.sharedAt)]);
