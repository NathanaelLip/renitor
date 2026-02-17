import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { db } from "../../../lib/db";

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Safety Check
  if (locals.user?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
    });
  }

  try {
    const { username, password, role } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Insert new user
    await db.execute({
      sql: "INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)",
      args: [crypto.randomUUID(), username, hashedPassword, role || "user"],
    });

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "User already exists" }), {
      status: 400,
    });
  }
};
