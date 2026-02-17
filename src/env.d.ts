declare namespace App {
  interface Locals {
    user: {
      id: string;
      username: string;
      role: "admin" | "user";
    } | null;
  }
}
