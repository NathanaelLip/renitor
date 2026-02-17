// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { getSession, COOKIE_NAME } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const session = getSession(context.cookies.get(COOKIE_NAME)?.value);

  // If trying to access app or dashboard without a session, boot to login
  if (
    !session &&
    (context.url.pathname.startsWith("/app") ||
      context.url.pathname.startsWith("/dashboard"))
  ) {
    return context.redirect("/");
  }

  // Attach session to locals so pages can use it
  context.locals.user = session
    ? {
        id: session.id,
        username: session.username,
        role: session.role,
      }
    : null;

  return next();
});
