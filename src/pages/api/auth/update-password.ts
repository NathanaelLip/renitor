import type { APIRoute } from "astro";
import { db } from "../../../lib/db";
import bcrypt from "bcryptjs";

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return new Response("Unauthorized", { status: 401 });

  const { currentPassword, newPassword } = await request.json();

  // 1. Get the user from the DB to get their current hash
  const result = await db.execute({
    sql: "SELECT password FROM users WHERE id = ?",
    args: [locals.user.id],
  });

  const user = result.rows[0];

  // 2. Verify current password
  const isValid = await bcrypt.compare(
    currentPassword,
    user.password as string,
  );

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: "Current password incorrect" }),
      { status: 400 },
    );
  }

  // 3. Hash and save the new password
  const newHash = await bcrypt.hash(newPassword, 10);
  await db.execute({
    sql: "UPDATE users SET password = ? WHERE id = ?",
    args: [newHash, locals.user.id],
  });

  // 4. Log the activity
  await db.execute({
    sql: "INSERT INTO activity_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)",
    args: [
      crypto.randomUUID(),
      locals.user.id,
      "CHANGE_PASSWORD",
      "User updated their own password",
    ],
  });

  return new Response(JSON.stringify({ success: true }));
};
