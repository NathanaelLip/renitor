import { useState } from "react";

export default function PasswordSettings() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ text: "", type: "" });

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus({ text: "Password updated successfully!", type: "success" });
        setForm({ currentPassword: "", newPassword: "" });
      } else {
        const data = await res.json();
        setStatus({ text: data.error || "Update failed", type: "error" });
      }
    } catch (err) {
      setStatus({ text: "Network error. Try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded-xl border border-slate-200"
    >
      <div>
        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">
          Current Password
        </label>
        <input
          type="password"
          required
          className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-amber-500"
          value={form.currentPassword}
          onChange={(e) =>
            setForm({ ...form, currentPassword: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">
          New Password
        </label>
        <input
          type="password"
          required
          minLength={6}
          className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-amber-500"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        />
      </div>

      <button
        disabled={loading}
        className={`w-full font-bold py-2 rounded transition ${loading ? "bg-slate-300" : "bg-neutral-800 text-white hover:bg-black"}`}
      >
        {loading ? "Updating..." : "Update Password"}
      </button>

      {status.text && (
        <p
          className={`text-center text-sm font-bold ${status.type === "success" ? "text-green-600" : "text-red-500"}`}
        >
          {status.text}
        </p>
      )}
    </form>
  );
}
