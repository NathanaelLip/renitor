import { useState, useEffect } from "react";
import { UserPlus, Shield, User, Trash2 } from "lucide-react";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user",
  });
  const [status, setStatus] = useState({ text: "", type: "" });

  // 1. Load data on mount
  const refreshData = async () => {
    try {
      const [uRes, lRes] = await Promise.all([
        fetch("/api/admin/get-users"),
        fetch("/api/admin/get-logs"),
      ]);
      const uData = await uRes.json();
      const lData = await lRes.json();
      setUsers(uData);
      setLogs(lData);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // 2. Form Handler: Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setStatus({ text: "Creating...", type: "info" });

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus({ text: "User created successfully!", type: "success" });
      setForm({ username: "", password: "", role: "user" });
      refreshData();
    } else {
      const err = await res.json();
      setStatus({ text: err.error || "Failed to create user", type: "error" });
    }
  };

  // 3. Delete Handler
  const handleDeleteUser = async (id, username) => {
    if (!confirm(`Permanently delete user "${username}"?`)) return;
    const res = await fetch("/api/admin/delete-user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) refreshData();
  };

  // 4. Clear Logs Handler
  const clearLogs = async () => {
    if (!confirm("Are you sure you want to wipe all system logs?")) return;

    try {
      const res = await fetch("/api/admin/clear-logs", {
        method: "DELETE",
      });

      if (res.ok) {
        setLogs([]);
        setMsg({ text: "Logs cleared successfully", type: "success" });
      } else {
        setMsg({ text: "Failed to clear logs", type: "error" });
      }
    } catch (err) {
      console.error("Error clearing logs:", err);
    }
  };

  return (
    <div className="space-y-6 mb-12">
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <Shield size={20} className="text-amber-600" />
          <h2 className="font-bold text-slate-800">Admin Control Center</h2>
        </div>

        <div className="p-6">
          {/* CREATE USER FORM */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              Add New Account
            </h3>
            <form
              onSubmit={handleCreateUser}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100"
            >
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Username
                </label>
                <input
                  required
                  className="border border-slate-200 p-2 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Password
                </label>
                <input
                  required
                  type="password"
                  className="border border-slate-200 p-2 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                  Access Level
                </label>
                <select
                  className="border border-slate-200 p-2 rounded text-sm bg-white outline-none"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">User (Standard)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>
              <button className="bg-slate-800 text-white font-bold py-2 rounded flex items-center justify-center gap-2 hover:bg-black transition shadow-sm">
                <UserPlus size={18} /> Create
              </button>
            </form>
            {status.text && (
              <p
                className={`mt-2 text-xs font-bold ${status.type === "success" ? "text-green-600" : "text-red-500"}`}
              >
                {status.text}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* USER LIST */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                Users
              </h3>
              <div className="border rounded-lg divide-y bg-white">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex justify-between items-center p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-full ${u.role === "admin" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}
                      >
                        <User size={14} />
                      </div>
                      <span className="text-sm font-medium">{u.username}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(u.id, u.username)}
                      className="text-slate-300 hover:text-red-500 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AUDIT LOGS */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Audit Trail
                </h3>
                <button
                  onClick={clearLogs}
                  className="text-[10px] font-bold text-red-400 hover:text-red-600 transition uppercase tracking-tighter"
                >
                  Clear History
                </button>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 h-48 overflow-y-auto font-mono text-[10px] space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="text-slate-300 border-b border-slate-800 pb-1"
                  >
                    <span className="text-amber-500">
                      [{new Date(log.created_at).toLocaleTimeString()}]
                    </span>
                    <span className="text-blue-400"> {log.username}</span>:{" "}
                    {log.details}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
