import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { memberRounds, members } from "../../../db/schema";
import { ensureActiveLeaderboard } from "../../leaderboard-store";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const nickname = typeof body.nickname === "string" ? body.nickname.trim().slice(0, 20) : "";
    const nicknameKey = nickname.toLocaleLowerCase("zh-Hant");
    const id = typeof body.id === "string" ? body.id.slice(0, 80) : "";
    const mode = body.mode === "jp" ? "jp" : body.mode === "tw" ? "tw" : "";
    const outcome = typeof body.outcome === "string" ? body.outcome.slice(0, 16) : "";
    if (!nicknameKey || !id || !mode || !outcome) return Response.json({ error: "牌局資料不完整" }, { status: 400 });
    const db = getDb();
    const member = (await db.select().from(members).where(eq(members.nicknameKey, nicknameKey)).limit(1))[0];
    if (!member) return Response.json({ error: "請重新登入暱稱" }, { status: 401 });
    const rawScore = mode === "tw" ? body.tai : (Number(body.yakuman) > 0 ? Number(body.yakuman) * 13 : body.han);
    const score = Math.max(0, Math.min(999, Number.isFinite(Number(rawScore)) ? Math.round(Number(rawScore)) : 0));
    const hand = Array.isArray(body.hand) ? body.hand.filter(x => Number.isInteger(x) && Number(x) >= 0 && Number(x) < 200).slice(0, 20) : [];
    const melds = Array.isArray(body.melds) ? body.melds.filter(Array.isArray).map(m => m.filter(x => Number.isInteger(x) && Number(x) >= 0 && Number(x) < 200).slice(0, 4)).slice(0, 5) : [];
    const breakdown = Array.isArray(body.items) ? body.items.filter(x => x && typeof x === "object").map(x => ({ name: String((x as Record<string, unknown>).name || "").slice(0, 40), value: String((x as Record<string, unknown>).value || "").slice(0, 20) })).filter(x => x.name).slice(0, 30) : [];
    const rules = body.rules && typeof body.rules === "object" ? body.rules : {};
    const rulesJson = JSON.stringify(rules).slice(0, 20000);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rulesJson));
    const rulesVersion = Array.from(new Uint8Array(digest)).slice(0, 8).map(value => value.toString(16).padStart(2, "0")).join("");
    const board = await ensureActiveLeaderboard(mode);
    await db.insert(memberRounds).values({
      id, memberId: member.id, leaderboardId: board.id, mode, outcome, score,
      pointsDelta: Math.max(-10000000, Math.min(10000000, Math.round(Number(body.pointsDelta) || 0))),
      roundLabel: typeof body.round === "string" ? body.round.slice(0, 40) : "",
      handJson: JSON.stringify(hand), meldsJson: JSON.stringify(melds), breakdownJson: JSON.stringify(breakdown),
      rulesVersion, rulesJson,
      playedAt: Number.isFinite(Number(body.time)) ? Number(body.time) : Date.now(),
    }).onConflictDoNothing();
    return Response.json({ saved: true });
  } catch (error) {
    console.error("round save failed", error);
    return Response.json({ error: "雲端戰績暫時無法儲存" }, { status: 500 });
  }
}
