import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { db } from "../../lib/db";
import { createSession, COOKIE_NAME } from "../../lib/auth";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const data = await request.formData();
  const username = data.get("username") as string;
  const password = data.get("password") as string;

  // 1. Find user in DB
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE username = ?",
    args: [username],
  });

  let user = result.rows[0];

  // 2. BOOTSTRAP LOGIC: If user not found, check if this is the first login ever
  if (!user) {
    const countResult = await db.execute("SELECT COUNT(*) as count FROM users");
    const isDbEmpty = Number(countResult.rows[0].count) === 0;

    if (isDbEmpty) {
      const userId = crypto.randomUUID();

      const hashedPassword = await bcrypt.hash(password, 10);
      await db.execute({
        sql: "INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, 'admin')",
        args: [userId, username, hashedPassword],
      });

      const newUserResult = await db.execute({
        sql: "SELECT * FROM users WHERE id = ?",
        args: [userId],
      });
      user = newUserResult.rows[0];
    } else {
      return new Response("Invalid credentials", { status: 401 });
    }
  }

  // 3. Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return new Response("Invalid credentials", { status: 401 });
  }

  // 4. Create session and set cookie
  const sessionData = await createSession({
    id: user.id as string,
    role: user.role as string,
    username: user.username as string,
  });

  cookies.set(COOKIE_NAME, sessionData, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return redirect("/dashboard", 302);
};
