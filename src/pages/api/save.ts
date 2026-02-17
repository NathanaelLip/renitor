import type { APIRoute } from "astro";
import { db, setupDatabase } from "../../lib/db";
import { getSession, COOKIE_NAME } from "../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession(cookies.get(COOKIE_NAME)?.value);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id, title, sections, category } = await request.json();

    if (!id || !title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    await db.execute({
      sql: `INSERT INTO lessons (id, title, sections, category, user_id, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            sections = excluded.sections,
            category = excluded.category,
            updated_at = CURRENT_TIMESTAMP`,
      args: [
        id,
        title,
        JSON.stringify(sections),
        category || "Uncategorized",
        session.id,
      ],
    });

    await db.execute({
      sql: `INSERT INTO activity_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        session.id,
        "UPDATE_LESSON",
        `Updated lesson: ${title.replace(/<[^>]*>/g, "").slice(0, 30)}...`,
      ],
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Save Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ message: "API is active. Use POST to save." }),
    { status: 200 },
  );
};
