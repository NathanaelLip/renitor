import React, { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Grip,
  Trash2,
  Palette,
  Check,
  Heading,
  LinkIcon,
  ListIcon,
  Bold,
  Italic,
} from "lucide-react";
import { PRESET_COLORS } from "./Editor";
import { BubbleMenu } from "@tiptap/react/menus";
import Link from "@tiptap/extension-link";

export default function Section({
  id,
  section,
  onContentChange,
  onDelete,
  variant,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id });

  // 1. Title Editor (Restricted to single line)
  const titleEditor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["http", "https"],
      }),
    ],
    immediatelyRender: false,
    content: section.title,
    onUpdate: ({ editor }) => {
      onContentChange(id, { title: editor.getHTML() });
    },
  });

  // 2. Content Editor
  const contentEditor = useEditor({
    extensions: [StarterKit],
    content: section.content,
    onUpdate: ({ editor }) => {
      onContentChange(id, { content: editor.getHTML() });
    },
  });

  // Sync editors if section data changes
  useEffect(() => {
    if (titleEditor && section.title !== titleEditor.getHTML()) {
      titleEditor.commands.setContent(section.title);
    }
    if (contentEditor && section.content !== contentEditor.getHTML()) {
      contentEditor.commands.setContent(section.content);
    }
  }, [section.title, section.content, titleEditor, contentEditor]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const setLink = () => {
    const previousUrl = contentEditor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      contentEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    contentEditor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  const toggleTitleBar = () => {
    const newVariant = section.variant === "title-bar" ? "" : "title-bar";
    onContentChange(id, { variant: newVariant });
    console.log("Title bar toggled");
  };

  const [showPalette, setShowPalette] = useState(false);
  const isTitleOnly = variant === "title-only";
  const isTopThree = variant === "top-three";
  const isTitleBar = section.variant === "title-bar";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${isTitleBar ? "bar bg-neutral-600 text-center h-full py-2!" : ""}
        ${isTopThree ? "bg-neutral-200 text-center h-full" : ""}

        ${isTitleOnly || isTopThree || isTitleBar ? "border-none py-4" : "border border-gray-100 flex shadow-sm hover:shadow-md"}
        group relative transition-all
      `}
    >
      {contentEditor && (
        <BubbleMenu
          editor={contentEditor}
          tippyOptions={{ duration: 100 }}
          className="no-print bg-slate-900 text-white p-1 rounded-lg flex gap-1 shadow-xl"
        >
          <button
            onClick={() => contentEditor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded ${contentEditor.isActive("bold") ? "bg-amber-600" : "hover:bg-slate-700"}`}
          >
            <Bold size={20} />
          </button>
          <button
            onClick={() => contentEditor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded ${contentEditor.isActive("italic") ? "bg-amber-600" : "hover:bg-slate-700"}`}
          >
            <Italic size={20} />
          </button>
          <button
            onClick={() =>
              contentEditor.chain().focus().toggleBulletList().run()
            }
            className={`px-2 py-1 rounded ${contentEditor.isActive("bulletList") ? "bg-amber-600" : "hover:bg-slate-700"}`}
          >
            <ListIcon size={20} />
          </button>
          <button
            onClick={setLink}
            className={`px-2 py-1 rounded flex items-center gap-1 ${contentEditor.isActive("link") ? "bg-amber-600" : "hover:bg-slate-700"}`}
          >
            <LinkIcon size={20} />
          </button>
        </BubbleMenu>
      )}

      {/* THE COLOR BAR */}
      <div
        className="colorbar w-4 shrink-0 relative cursor-pointer group/bar"
        style={{ backgroundColor: section.color || "#e2e8f0" }}
        onClick={() => setShowPalette(!showPalette)}
      >
        {!isTitleOnly && !isTopThree && !isTitleBar && (
          <div
            className={`
                no-print absolute left-0 top-0 z-50 pl-10 transition-all duration-200
                ${showPalette ? "opacity-100 visible" : "opacity-0 invisible group-hover/bar:opacity-100 group-hover/bar:visible delay-500"}
              `}
          >
            <div className="bg-white shadow-2xl border border-gray-200 p-3 rounded-xl flex flex-col gap-3 w-auto">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Presets
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPalette(false);
                  }}
                  className="text-gray-300 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-auto grid-flow-col gap-4">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onContentChange(id, { color: color.value });
                    }}
                    className="group/swatch relative w-10 h-10 rounded-lg border border-black/5 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    style={{ backgroundColor: color.value }}
                  >
                    {section.color === color.value && (
                      <div className="bg-white/20 rounded-full p-1">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                    {/* Tooltip on swatch hover */}
                    <span className="absolute bottom-full mb-2 hidden group-hover/swatch:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      {color.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t pt-2 mt-1 relative h-8 rounded-lg border-dashed border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50">
                <input
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  value={section.color || "#e2e8f0"}
                  onChange={(e) =>
                    onContentChange(id, { color: e.target.value })
                  }
                />
                <div className="flex items-center gap-2 text-gray-400">
                  <Palette size={14} />
                  <span className="text-[10px] font-medium">Custom</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="no-print opacity-0 group-hover:opacity-100 absolute -right-14 z-10 flex flex-col gap-2 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="p-2 bg-white border rounded-lg shadow-sm text-gray-400 hover:text-amber-600 cursor-grab"
        >
          <Grip size={18} />
        </button>

        <button
          onClick={toggleTitleBar}
          className={`p-2 border rounded-lg shadow-sm transition-colors ${
            isTitleBar
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-white text-gray-400 hover:text-amber-500"
          }`}
          title="Toggle Title Bar Mode"
        >
          <Heading size={18} />
        </button>

        <button
          onClick={() => onDelete(id)}
          className="p-2 bg-white border rounded-lg shadow-sm text-gray-400 hover:text-red-500"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 ${isTitleOnly || isTitleBar ? "p-0" : "p-4"}`}>
        {/* TITLE EDITOR */}
        <div
          className={`
                title-editor font-bold tracking-tight text-black
                ${isTitleBar ? "text-lg! text-white! mb-0 pb-0 border-none" : ""}
                ${isTitleOnly || isTitleBar ? "text-xl mb-0" : "text-lg border-b border-transparent group-hover:border-gray-300 pb-2 mb-3"}
              `}
        >
          <EditorContent editor={titleEditor} />
        </div>

        {/* CONTENT EDITOR (Hidden for Title-Only) */}
        {!isTitleOnly && !isTitleBar && (
          <div className="prose prose-amber max-w-none text-black leading-relaxed text-sm">
            <EditorContent editor={contentEditor} />
          </div>
        )}
      </div>
    </div>
  );
}
