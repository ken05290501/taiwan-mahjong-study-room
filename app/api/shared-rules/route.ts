import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { sharedRules } from "../../../db/schema";
import { isAdminRequest } from "../../admin-auth";

const DEFAULTS = { base: 100, unit: 20, flowers: true, redDora: true, tw: null, jp: null };

export async function GET() {
  try {
    const row = (await getDb().select().from(sharedRules).where(eq(sharedRules.id, 1)).limit(1))[0];
    return Response.json({ rules: row ? JSON.parse(row.rulesJson) : DEFAULTS, updatedAt: row?.updatedAt || null });
  } catch (error) {
    console.error("shared rules load failed", error);
    return Response.json({ error: "共用台數設定暫時無法載入" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!await isAdminRequest(request)) return Response.json({ error: "管理員登入已過期，請重新驗證" }, { status: 401 });
    const body = await request.json() as { rules?: Record<string, unknown> };
    const input = body.rules || {};
    const rules = {
      base: Math.max(0, Math.min(10000, Math.round(Number(input.base) || 0))),
      unit: Math.max(0, Math.min(10000, Math.round(Number(input.unit) || 0))),
      flowers: input.flowers !== false,
      redDora: input.redDora !== false,
      tw: input.tw && typeof input.tw === "object" ? input.tw : null,
      jp: input.jp && typeof input.jp === "object" ? input.jp : null,
    };
    const updatedAt = Date.now();
    await getDb().insert(sharedRules).values({ id: 1, rulesJson: JSON.stringify(rules), updatedAt }).onConflictDoUpdate({ target: sharedRules.id, set: { rulesJson: JSON.stringify(rules), updatedAt } });
    return Response.json({ rules, updatedAt });
  } catch (error) {
    console.error("shared rules save failed", error);
    return Response.json({ error: "共用台數設定儲存失敗" }, { status: 500 });
  }
}
