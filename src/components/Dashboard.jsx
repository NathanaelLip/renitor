import { useState, useEffect } from "react";
import AdminPanel from "../components/AdminPanel.jsx";
import {
  Trash2,
  SquarePen,
  ChevronDown,
  ChevronRight,
  Folder,
  ChevronLeft,
} from "lucide-react";

export default function Dashboard({
  initialGroupedArray,
  initialCollapsed,
  currentPage,
  totalPages,
  allUsers = [],
  currentUser,
}) {
  const [grouped, setGrouped] = useState(initialGroupedArray);
  const [collapsed, setCollapsed] = useState(new Set());

  const deleteLesson = async (id, category, rawTitle) => {
    const cleanTitle = rawTitle.replace(/<[^>]*>/g, "");
    if (!window.confirm(`Are you sure you want to delete "${cleanTitle}"?`))
      return;

    try {
      const response = await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        const updatedList = grouped.map((group) => {
          if (group.name === category) {
            return {
              ...group,
              items: group.items.filter((lesson) => lesson.id !== id),
            };
          }
          return group;
        });

        const finalGrouped = updatedList.filter(
          (group) => group.items.length > 0,
        );

        setGrouped(finalGrouped);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const setCookie = (name, value) => {
    document.cookie = `${name}=${JSON.stringify(value)}; path=/; max-age=31536000`;
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return JSON.parse(parts.pop().split(";").shift());
    return [];
  };

  useEffect(() => {
    const saved = getCookie("renitor_collapsed_cats");
    if (saved) setCollapsed(new Set(saved));
  }, []);

  const toggleCategory = (category) => {
    const newCollapsed = new Set(collapsed);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }

    setCollapsed(newCollapsed);
    setCookie("renitor_collapsed_cats", Array.from(newCollapsed));
  };

  const changeOwner = async (lessonId, newUserId) => {
    const res = await fetch("/api/admin/update-lesson-owner", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, newUserId }),
    });

    if (res.ok) {
      alert("Owner updated successfully");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        {grouped.map((group) => (
          <div
            key={group.name}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* CATEGORY HEADER */}
            <button
              onClick={() => toggleCategory(group.name)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Folder size={20} className="text-amber-600" />
                <h2 className="font-bold text-gray-700 uppercase tracking-tight">
                  {group.name}{" "}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({group.items.length})
                  </span>
                </h2>
              </div>
              {collapsed.has(group.name) ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>

            {/* LESSONS LIST */}
            {!collapsed.has(group.name) && (
              <div className="divide-y divide-gray-100">
                {group.items.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-4 flex justify-between items-center hover:bg-slate-50 transition"
                  >
                    <div className="truncate pr-4">
                      <h3
                        className="font-semibold text-lg text-gray-800 truncate"
                        dangerouslySetInnerHTML={{ __html: lesson.title }}
                      />
                      <p className="text-xs text-gray-400">
                        ID: {lesson.id.slice(0, 8)}... | Updated:{" "}
                        {new Date(lesson.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-4 items-center shrink-0">
                      {currentUser?.role === "admin" && (
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            Owner
                          </label>
                          <select
                            className="text-xs border border-slate-200 rounded bg-white p-1 outline-none focus:border-amber-500"
                            defaultValue={lesson.user_id}
                            onChange={async (e) => {
                              const newUserId = e.target.value;
                              const res = await fetch(
                                "/api/admin/update-lesson-owner",
                                {
                                  method: "PATCH",
                                  body: JSON.stringify({
                                    lessonId: lesson.id,
                                    newUserId,
                                  }),
                                },
                              );
                              if (res.ok) {
                                // Provide subtle feedback
                                e.target.classList.add("border-green-500");
                                setTimeout(
                                  () =>
                                    e.target.classList.remove(
                                      "border-green-500",
                                    ),
                                  2000,
                                );
                              }
                            }}
                          >
                            {allUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.username}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <a
                        href={`/app/${lesson.id}`}
                        className="text-amber-600 hover:scale-110 transition"
                      >
                        <SquarePen size={22} />
                      </a>
                      <button
                        onClick={() =>
                          deleteLesson(lesson.id, group.name, lesson.title)
                        }
                        className="text-red-400 hover:text-red-600 hover:scale-110 transition"
                      >
                        <Trash2 size={22} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* PAGINATION UI */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4 border-t pt-6">
            <a
              href={`?page=${currentPage - 1}`}
              className={`p-2 border rounded ${currentPage <= 1 ? "pointer-events-none text-gray-300" : "hover:bg-gray-50"}`}
            >
              <ChevronLeft size={20} />
            </a>
            <span className="text-sm font-medium text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <a
              href={`?page=${currentPage + 1}`}
              className={`p-2 border rounded ${currentPage >= totalPages ? "pointer-events-none text-gray-300" : "hover:bg-gray-50"}`}
            >
              <ChevronRight size={20} />
            </a>
          </div>
        )}
      </div>

      <div className="pt-6">
        {currentUser?.role === "admin" && <AdminPanel />}
      </div>
    </div>
  );
}
