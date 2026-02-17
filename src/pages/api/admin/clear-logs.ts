import type { APIRoute } from "astro";
import { db } from "../../../lib/db";

export const DELETE: APIRoute = async ({ locals }) => {
  if (locals.user?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
    });
  }

  try {
    await db.execute("DELETE FROM activity_logs");
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to clear logs" }), {
      status: 500,
    });
  }
};
