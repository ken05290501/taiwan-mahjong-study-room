import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { memberRounds, members } from "../../../db/schema";
import { adminSessionCookie, clearAdminSessionCookie, isAdminRequest, verifyAdminPassword } from "../../admin-auth";

export async function GET(request: Request) {
  return Response.json({ authenticated: await isAdminRequest(request) });
}

export async function POST(request: Request) {
  const body = await request.json() as { password?: string; action?: string; memberId?: number };
  if (!body.action || body.action === "verify") {
    if (!await verifyAdminPassword(body.password)) return Response.json({ error: "管理員密碼錯誤" }, { status: 403 });
    return Response.json({ ok: true }, { headers: { "Set-Cookie": await adminSessionCookie() } });
  }
  if (body.action === "logout") return Response.json({ ok: true }, { headers: { "Set-Cookie": clearAdminSessionCookie() } });
  if (!await isAdminRequest(request)) return Response.json({ error: "管理員登入已過期，請重新驗證" }, { status: 401 });
  if (body.action === "clear-member" && Number.isInteger(body.memberId)) {
    const db = getDb();
    await db.delete(memberRounds).where(eq(memberRounds.memberId, Number(body.memberId)));
    await db.delete(members).where(eq(members.id, Number(body.memberId)));
    return Response.json({ ok: true });
  }
  return Response.json({ error: "不支援的管理操作" }, { status: 400 });
}
