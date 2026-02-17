export const COOKIE_NAME = "renitor_session";

const SECRET = "super-secret-key-123";

export async function createSession(user: {
  id: string;
  role: string;
  username: string;
}) {
  return btoa(JSON.stringify(user));
}

export function getSession(cookieValue: string | undefined) {
  if (!cookieValue) return null;
  try {
    return JSON.parse(atob(cookieValue));
  } catch {
    return null;
  }
}
