import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Printer, RefreshCw, LogOut, Folder } from "lucide-react";

import Uploader from "./Uploader";
import Section from "./Section";

export const PRESET_COLORS = [
  { name: "Talk", value: "#4643ba", label: "Talk" },
  { name: "Scripture", value: "#c52026", label: "Scripture" },
  { name: "Story", value: "#32bdd4", label: "Story" },
  { name: "Image", value: "#a1cb3a", label: "Image" },
  { name: "Video", value: "#e2de1b", label: "Video" },
  { name: "Question", value: "#3290ce", label: "Question" },
  { name: "Object Lesson", value: "#52b849", label: "Object Lesson" },
  { name: "Activity", value: "#4fc0a2", label: "Activity" },
  { name: "Discussion", value: "#a2dae1", label: "Discussion" },
  { name: "Prayer", value: "#ec497f", label: "Prayer" },
  { name: "Reflection", value: "#ad4e9d", label: "Reflection" },
  { name: "Response", value: "#5c479c", label: "Response" },
  { name: "Music", value: "#eaab20", label: "Music" },
  { name: "Poll", value: "#d84826", label: "Poll" },
];

export default function Editor({
  initialSections = [],
  initialTitle,
  initialId,
  initialCategory,
  existingCategories = [],
}) {
  const [sections, setSections] = useState(initialSections);
  const [saveStatus, setSaveStatus] = useState("Ready");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isModular, setIsModular] = useState(true);
  const [title, setTitle] = useState(initialTitle || "New Lesson");
  const [category, setCategory] = useState(initialCategory || "Uncategorized");
  const [lessonId] = useState(initialId || crypto.randomUUID());
  const [isMounted, setIsMounted] = useState(false);

  // --- 1. Sensors for Touch, Mouse, and Keyboard ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // --- 2. The Save Logic ---
  const saveToServer = useCallback(
    async (dataToSave) => {
      if (!dataToSave || dataToSave.length === 0) return;

      setSaveStatus("Saving...");
      try {
        const response = await fetch("/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: lessonId,
            title: title,
            sections: dataToSave,
            category: category,
          }),
        });

        if (response.ok) {
          setSaveStatus("All changes saved");
          if (!window.location.pathname.includes(lessonId)) {
            window.history.replaceState(null, "", `/app/${lessonId}`);
          }
        }
      } catch (err) {
        setSaveStatus("Connection Error");
      }
    },
    [lessonId, title, category],
  );

  // --- 3. Debounced Auto-Save Effect ---
  useEffect(() => {
    setIsMounted(true);
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }

    if (sections.length > 0) {
      const rawTitle = sections[0].title;

      // 1. Create a temporary element to let the browser parse the HTML
      const doc = new DOMParser().parseOuterHTML
        ? null
        : new DOMParser().parseFromString(rawTitle, "text/html");
      const cleanText = doc.body.textContent || doc.body.innerText || "";

      // 2. Trim and update state
      const finalTitle = cleanText.trim();

      if (finalTitle && finalTitle !== title) {
        setTitle(finalTitle.substring(0, 60));
      }
    }

    const timer = setTimeout(() => {
      saveToServer(sections);
    }, 2000); // 2 second delay

    const displayTitle = title || "Renitor | New Lesson";
    document.title = `Renitor | ${displayTitle}`;

    return () => clearTimeout(timer);
  }, [sections, saveToServer, title]);

  // --- 4. Handlers ---
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateSection = (id, updatedData) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return typeof updatedData === "string"
            ? { ...s, content: updatedData }
            : { ...s, ...updatedData };
        }
        return s;
      }),
    );
  };

  const deleteSection = (id) => {
    if (window.confirm("Delete this section?")) {
      setSections((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const addNewSection = () => {
    const newId = `section-${Date.now()}`;
    setSections([
      ...sections,
      {
        id: newId,
        title: "NEW SECTION",
        content: "Type your details here...",
      },
    ]);
  };

  const headerSections = isModular ? sections.slice(0, 4) : [];
  const listSections = isModular ? sections.slice(4) : sections;

  if (!isMounted)
    return (
      <div className="flex justify-center p-20 text-center text-amber-500">
        <RefreshCw size={100} className="animate-spin" />
      </div>
    );

  return (
    <div className="print-padding max-w-5xl mx-auto py-8">
      {sections.length === 0 && !initialId ? (
        <div className="no-print bg-white p-12 shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Upload Lesson
            </h1>
            <p className="text-gray-500 mt-2">
              Upload a .docx file to begin customizing your lesson.
            </p>
          </div>
          <Uploader onDataLoaded={setSections} />
        </div>
      ) : (
        <div className="animate-in fade-in duration-100">
          <header className="no-print sticky top-4 z-50 mb-8 flex justify-between items-center bg-white/90 backdrop-blur-xs p-4 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-amber-600 p-2 text-white">
                <a href="/dashboard" className="text-white">
                  <LogOut size={24} />
                </a>
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold text-gray-900 leading-none">
                  Renitor Editing - {title}
                </h1>
                <span className="text-[10px] uppercase tracking-tighter font-semibold text-amber-500 mt-1 flex items-center gap-1">
                  {saveStatus === "Saving..." && (
                    <RefreshCw size={10} className="animate-spin" />
                  )}
                  {saveStatus === "All changes saved"
                    ? `Saved - ${title}`
                    : saveStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Category Input */}
              <div className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-amber-500 transition-all">
                <Folder size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onBlur={() =>
                    setCategory((prev) => prev.trim() || "Uncategorized")
                  }
                  list="category-suggestions"
                  placeholder="Series Name (e.g. WOW!)"
                  className="outline-none text-sm font-medium text-gray-700 w-40 placeholder:text-gray-300"
                />

                <datalist id="category-suggestions">
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addNewSection}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-sm font-semibold hover:bg-gray-100 transition"
                >
                  <Plus size={16} /> Add Block
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 shadow-md shadow-amber-200 transition"
                >
                  <Printer size={16} /> Export PDF
                </button>
              </div>
            </div>
          </header>

          {/* DRAGGABLE AREA */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="renitor bg-white p-24 mx-auto min-h-[297mm]">
              {/* SPECIAL HEADER GRID (First 4 Sections) */}
              {isModular && headerSections.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {/* 1. File Title - Full Width */}
                  <div className="title col-span-2 border-b-2 border-gray-100 mb-4">
                    <Section
                      id={headerSections[0].id}
                      section={headerSections[0]}
                      onContentChange={updateSection}
                      onDelete={deleteSection}
                      variant="title-only"
                    />
                  </div>

                  {/* 2 & 3. Big Idea & Bible - Side by Side */}
                  <div className="three col-span-2 flex justify-between gap-4">
                    {headerSections.slice(1, 3).map((section) => (
                      <div key={section.id} className="col-span-1 w-1/2">
                        <Section
                          id={section.id}
                          section={section}
                          onContentChange={updateSection}
                          onDelete={deleteSection}
                          variant="top-three"
                        />
                      </div>
                    ))}
                  </div>

                  {/* 4. About This Week - Full Width */}
                  {headerSections[3] && (
                    <div className="three col-span-2 mt-0">
                      <Section
                        id={headerSections[3].id}
                        section={headerSections[3]}
                        onContentChange={updateSection}
                        onDelete={deleteSection}
                        variant="top-three"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STANDARD DRAGGABLE LIST (Rest of the content) */}
              <SortableContext
                items={listSections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="normal flex flex-col gap-4">
                  {listSections.map((section) => (
                    <Section
                      key={section.id}
                      id={section.id}
                      section={section}
                      onContentChange={updateSection}
                      onDelete={deleteSection}
                      variant=""
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          </DndContext>
        </div>
      )}
    </div>
  );
}
