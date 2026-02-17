import type { APIRoute } from "astro";
import { db } from "../../../lib/db";

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (locals.user?.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  const { lessonId, newUserId } = await request.json();

  await db.execute({
    sql: "UPDATE lessons SET user_id = ? WHERE id = ?",
    args: [newUserId, lessonId],
  });

  return new Response(JSON.stringify({ success: true }));
};
