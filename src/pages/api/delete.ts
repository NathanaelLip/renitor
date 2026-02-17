// src/pages/api/delete.ts
import type { APIRoute } from 'astro';
import { db } from '../../lib/db';

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), { status: 400 });
    }

    await db.execute({
      sql: "DELETE FROM lessons WHERE id = ?",
      args: [id]
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
