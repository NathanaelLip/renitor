import type { APIRoute } from "astro";
import { db } from "../../../lib/db";

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (locals.user?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
    });
  }

  const { id } = await request.json();

  if (id === locals.user.id) {
    return new Response(
      JSON.stringify({ error: "You cannot delete yourself!" }),
      { status: 400 },
    );
  }

  await db.execute({
    sql: "DELETE FROM users WHERE id = ?",
    args: [id],
  });

  return new Response(JSON.stringify({ success: true }));
};
