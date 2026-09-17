import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { leaderboards, memberRounds } from "../db/schema";

export async function ensureActiveLeaderboard(mode: "tw" | "jp") {
  const db = getDb();
  let board = (await db.select().from(leaderboards).where(and(eq(leaderboards.mode, mode), eq(leaderboards.status, "active"))).limit(1))[0];
  if (!board) {
    await db.insert(leaderboards).values({ name: mode === "tw" ? "台麻公開榜" : "日麻公開榜", mode, status: "active", createdAt: Date.now() }).onConflictDoNothing();
    board = (await db.select().from(leaderboards).where(and(eq(leaderboards.mode, mode), eq(leaderboards.status, "active"))).limit(1))[0];
  }
  if (!board) throw new Error("無法建立排行榜");
  await db.update(memberRounds).set({ leaderboardId: board.id }).where(and(eq(memberRounds.mode, mode), isNull(memberRounds.leaderboardId)));
  return board;
}

export async function listLeaderboards(mode: "tw" | "jp") {
  await ensureActiveLeaderboard(mode);
  return getDb().select().from(leaderboards).where(eq(leaderboards.mode, mode)).orderBy(desc(leaderboards.createdAt));
}
