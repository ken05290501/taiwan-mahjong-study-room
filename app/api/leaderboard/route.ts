import { and, avg, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { leaderboards, memberRounds, members } from "../../../db/schema";
import { isAdminRequest } from "../../admin-auth";
import { ensureActiveLeaderboard, listLeaderboards } from "../../leaderboard-store";

const parse = (value: string | undefined) => { try { return JSON.parse(value || "[]"); } catch { return []; } };

export async function GET(request: Request) {
  try {
    const url = new URL(request.url), mode = url.searchParams.get("mode") === "jp" ? "jp" : "tw";
    const metric = url.searchParams.get("metric") === "average" ? "average" : "max";
    const boards = await listLeaderboards(mode);
    const requested = Number(url.searchParams.get("board"));
    const board = boards.find(row => row.id === requested) || boards.find(row => row.status === "active") || boards[0];
    if (!board) return Response.json({ mode, metric, boards: [], rows: [] });
    const db = getDb();
    if (metric === "average") {
      const average = avg(memberRounds.pointsDelta);
      const ranked = await db.select({ memberId: members.id, nickname: members.nickname, score: average, games: sql<number>`count(${memberRounds.id})`, wins: sql<number>`sum(case when ${memberRounds.outcome} in ('win','self') then 1 else 0 end)` })
        .from(memberRounds).innerJoin(members, eq(memberRounds.memberId, members.id)).where(eq(memberRounds.leaderboardId, board.id))
        .groupBy(members.id, members.nickname).orderBy(desc(average), desc(sql`count(${memberRounds.id})`), members.nickname).limit(100);
      return Response.json({ mode, metric, board, boards, rows: ranked.map((row, index) => ({ rank: index + 1, ...row, score: Math.round(Number(row.score) || 0) })) });
    }
    const best = sql<number>`max(${memberRounds.score})`;
    const ranked = await db.select({ memberId: members.id, nickname: members.nickname, score: best, games: sql<number>`count(${memberRounds.id})` })
      .from(memberRounds).innerJoin(members, eq(memberRounds.memberId, members.id))
      .where(and(eq(memberRounds.leaderboardId, board.id), inArray(memberRounds.outcome, ["win", "self"]))).groupBy(members.id, members.nickname)
      .orderBy(desc(best), members.nickname).limit(100);
    const rows = await Promise.all(ranked.map(async row => {
      const detail = (await db.select({ handJson: memberRounds.handJson, meldsJson: memberRounds.meldsJson, breakdownJson: memberRounds.breakdownJson, roundLabel: memberRounds.roundLabel, rulesVersion: memberRounds.rulesVersion, rulesJson: memberRounds.rulesJson, playedAt: memberRounds.playedAt })
        .from(memberRounds).where(and(eq(memberRounds.memberId, row.memberId), eq(memberRounds.leaderboardId, board.id), eq(memberRounds.score, row.score), inArray(memberRounds.outcome, ["win", "self"])))
        .orderBy(desc(memberRounds.playedAt)).limit(1))[0];
      return { ...row, hand: parse(detail?.handJson), melds: parse(detail?.meldsJson), items: parse(detail?.breakdownJson), round: detail?.roundLabel || "", rulesVersion: detail?.rulesVersion || "舊版" };
    }));
    return Response.json({ mode, metric, board, boards, rows: rows.map((row, index) => ({ rank: index + 1, ...row })) });
  } catch (error) {
    console.error("leaderboard load failed", error);
    return Response.json({ error: "排行榜暫時無法載入" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!await isAdminRequest(request)) return Response.json({ error: "管理員登入已過期，請重新驗證" }, { status: 401 });
    const body = await request.json() as { action?: string; mode?: string; name?: string; boardId?: number };
    const mode = body.mode === "jp" ? "jp" : "tw", db = getDb();
    if (body.action === "rollover") {
      const name = String(body.name || "").trim().slice(0, 40);
      if (name.length < 2) return Response.json({ error: "排行榜名稱至少需要 2 個字" }, { status: 400 });
      const current = await ensureActiveLeaderboard(mode), now = Date.now();
      await db.batch([
        db.update(leaderboards).set({ status: "archived", lockedAt: now }).where(eq(leaderboards.id, current.id)),
        db.insert(leaderboards).values({ name, mode, status: "active", createdAt: now }),
      ]);
      const created = (await db.select().from(leaderboards).where(and(eq(leaderboards.mode, mode), eq(leaderboards.status, "active"))).limit(1))[0];
      return Response.json({ board: created, archived: current.id });
    }
    if (body.action === "rename" && Number.isInteger(body.boardId)) {
      const name = String(body.name || "").trim().slice(0, 40);
      if (name.length < 2) return Response.json({ error: "排行榜名稱至少需要 2 個字" }, { status: 400 });
      await db.update(leaderboards).set({ name }).where(eq(leaderboards.id, Number(body.boardId)));
      return Response.json({ ok: true });
    }
    return Response.json({ error: "不支援的排行榜操作" }, { status: 400 });
  } catch (error) {
    console.error("leaderboard admin failed", error);
    return Response.json({ error: "排行榜操作失敗" }, { status: 500 });
  }
}
