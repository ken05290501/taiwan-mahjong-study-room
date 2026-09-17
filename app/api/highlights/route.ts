import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { members, sharedHighlights } from "../../../db/schema";

const tiles = (value: unknown, max: number) => Array.isArray(value)
  ? value.filter(x => Number.isInteger(x) && Number(x) >= 0 && Number(x) < 200).slice(0, max)
  : [];
const textValue = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const parse = (value: string) => { try { return JSON.parse(value); } catch { return []; } };

export async function GET(request: Request) {
  try {
    const requested = new URL(request.url).searchParams.get("mode");
    const mode = requested === "tw" || requested === "jp" ? requested : null;
    const db = getDb();
    const rows = await db.select({
      id: sharedHighlights.id, nickname: members.nickname, mode: sharedHighlights.mode,
      round: sharedHighlights.roundLabel, label: sharedHighlights.winLabel,
      outcome: sharedHighlights.outcomeLabel, handJson: sharedHighlights.handJson,
      winning: sharedHighlights.winningTile, meldsJson: sharedHighlights.meldsJson,
      flowersJson: sharedHighlights.flowersJson, itemsJson: sharedHighlights.breakdownJson,
      total: sharedHighlights.totalLabel, points: sharedHighlights.points, sharedAt: sharedHighlights.sharedAt,
    }).from(sharedHighlights).innerJoin(members, eq(sharedHighlights.memberId, members.id))
      .where(mode ? eq(sharedHighlights.mode, mode) : undefined)
      .orderBy(desc(sharedHighlights.sharedAt)).limit(50);
    return Response.json({ rows: rows.map(row => ({
      ...row, hand: parse(row.handJson), melds: parse(row.meldsJson), flowers: parse(row.flowersJson), items: parse(row.itemsJson),
      handJson: undefined, meldsJson: undefined, flowersJson: undefined, itemsJson: undefined,
    })) });
  } catch (error) {
    console.error("highlights load failed", error);
    return Response.json({ error: "牌面高光暫時無法載入" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const nickname = textValue(body.nickname, 20), nicknameKey = nickname.toLocaleLowerCase("zh-Hant");
    const id = textValue(body.id, 80), mode = body.mode === "jp" ? "jp" : body.mode === "tw" ? "tw" : "";
    if (!nicknameKey || !id || !mode) return Response.json({ error: "分享資料不完整" }, { status: 400 });
    const db = getDb();
    const member = (await db.select().from(members).where(eq(members.nicknameKey, nicknameKey)).limit(1))[0];
    if (!member) return Response.json({ error: "請重新登入暱稱" }, { status: 401 });
    const hand = tiles(body.hand, 20);
    const melds = Array.isArray(body.melds) ? body.melds.filter(Array.isArray).map(x => tiles(x, 4)).slice(0, 5) : [];
    const flowers = tiles(body.flowers, 8);
    const items = Array.isArray(body.items) ? body.items.filter(x => x && typeof x === "object").map(x => ({
      name: textValue((x as Record<string, unknown>).name, 40), value: textValue((x as Record<string, unknown>).value, 20),
    })).filter(x => x.name).slice(0, 30) : [];
    const winning = Number.isInteger(body.winning) && Number(body.winning) >= 0 && Number(body.winning) < 200 ? Number(body.winning) : null;
    await db.insert(sharedHighlights).values({
      id, memberId: member.id, mode, roundLabel: textValue(body.round, 40), winLabel: textValue(body.label, 20),
      outcomeLabel: textValue(body.outcome, 60), handJson: JSON.stringify(hand), winningTile: winning,
      meldsJson: JSON.stringify(melds), flowersJson: JSON.stringify(flowers), breakdownJson: JSON.stringify(items),
      totalLabel: textValue(body.total, 40), points: Math.max(0, Math.min(10000000, Math.round(Number(body.points) || 0))),
      sharedAt: Date.now(),
    }).onConflictDoNothing();
    return Response.json({ saved: true, id });
  } catch (error) {
    console.error("highlight save failed", error);
    return Response.json({ error: "牌面高光暫時無法分享" }, { status: 500 });
  }
}
