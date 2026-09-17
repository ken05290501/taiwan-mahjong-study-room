import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { members } from "../../../db/schema";

function cleanNickname(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 20) : "";
}

export async function POST(request: Request) {
  try {
    const nickname = cleanNickname((await request.json() as { nickname?: unknown }).nickname);
    if (nickname.length < 2) return Response.json({ error: "暱稱請輸入 2–20 個字" }, { status: 400 });
    const nicknameKey = nickname.toLocaleLowerCase("zh-Hant");
    const now = Date.now();
    const db = getDb();
    const existing = await db.select().from(members).where(eq(members.nicknameKey, nicknameKey)).limit(1);
    if (existing[0]) {
      const [member] = await db.update(members).set({ nickname, lastSeenAt: now }).where(eq(members.id, existing[0].id)).returning();
      return Response.json({ member: { id: member.id, nickname: member.nickname } });
    }
    const [member] = await db.insert(members).values({ nickname, nicknameKey, createdAt: now, lastSeenAt: now }).returning();
    return Response.json({ member: { id: member.id, nickname: member.nickname } }, { status: 201 });
  } catch (error) {
    console.error("member sign-in failed", error);
    return Response.json({ error: "會員服務暫時無法使用" }, { status: 500 });
  }
}
