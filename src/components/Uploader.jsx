import React from "react";
import mammoth from "mammoth";

export default function Uploader({ onDataLoaded }) {
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;

      const options = {
        ignoreEmptyParagraphs: true,
        styleMap: [
          "p[style-name='Heading 1'] => h2:fresh",
          "p[style-name='Heading 2'] => h3:fresh",
          "b => strong",
        ],
      };

      try {
        const result = await mammoth.convertToHtml({ arrayBuffer }, options);
        let html = result.value;

        html = html.replace(/<img[^>]*>/g, "");

        const parsedSections = parseHtmlToSections(html);
        onDataLoaded(parsedSections);
      } catch (err) {
        console.error("Parsing failed:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseHtmlToSections = (html) => {
    const parser = new DOMParser();
    const cleanHtml = html.replace(/<img[^>]*>/g, "").replace(/&nbsp;/g, " ");
    const doc = parser.parseFromString(cleanHtml, "text/html");

    const tables = Array.from(doc.querySelectorAll("table"));
    tables.forEach((table) => {
      const cells = Array.from(table.querySelectorAll("td"));
      cells.forEach((cell) => {
        const fragment = doc.createDocumentFragment();

        const children = Array.from(cell.children);
        children.forEach((child) => {
          child.setAttribute("data-from-table", "true");
          fragment.appendChild(child);
        });

        table.parentNode.insertBefore(fragment, table);
      });
      table.parentNode.removeChild(table);
    });

    const nodes = Array.from(doc.body.children);
    const sections = [];
    const PRIORITY = ["BIG IDEA", "BIBLE", "ABOUT THIS WEEK"];

    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      const textContent = currentNode.textContent.trim();
      const upperText = textContent.toUpperCase();

      if (!textContent) continue;

      const isPriority = PRIORITY.includes(upperText);
      const isBold = currentNode.querySelector("b, strong") !== null;
      const isAllCaps = textContent === upperText && textContent.length > 3;

      const looksLikeHeading =
        isPriority || (textContent.length < 65 && (isBold || isAllCaps));

      if (looksLikeHeading) {
        let gatheredContent = "";
        let j = i + 1;

        while (j < nodes.length) {
          const nextNode = nodes[j];
          const nextText = nextNode.textContent.trim().toUpperCase();
          const nextIsPriority = PRIORITY.includes(nextText);

          const isFromTable =
            nextNode.getAttribute("data-from-table") === "true";

          if (nextIsPriority) break;

          const nextIsBold = nextNode.querySelector("b, strong") !== null;
          const nextIsHeader =
            nextNode.textContent.trim().length < 65 &&
            (nextIsBold ||
              nextText === nextNode.textContent.trim().toUpperCase());

          if (nextIsHeader && !isFromTable) {
            break;
          }

          gatheredContent += nextNode.outerHTML;
          j++;
          i++;
        }

        const getColorByTitle = (title) => {
          const txt = title.toUpperCase();

          const t = txt
            .trim()
            .split(/\s+/)[0]
            .replace(/[^a-zA-Z]/g, "")
            .toUpperCase();

          if (t.includes("TALK") || t.includes("Welcome") || t.includes("BIG"))
            return "#4643ba";
          if (t.includes("SCRIPTURE") || t.includes("MEMORY")) return "#c52026";
          if (t.includes("STORY")) return "#32bdd4";
          if (t.includes("IMAGE")) return "#a1cb3a";
          if (t.includes("VIDEO")) return "#e2de1b";
          if (t.includes("QUESTION")) return "#3290ce";
          if (t.includes("OBJECT")) return "#52b849";
          if (t.includes("ACTIVITY")) return "#4fc0a2";
          if (t.includes("DISCUSSION")) return "#a2dae1";
          if (t.includes("PRAYER")) return "#ec497f";
          if (t.includes("REFLECTION")) return "#ad4e9d";
          if (t.includes("RESPONSE")) return "#5c479c";
          if (t.includes("MUSIC")) return "#eaab20";
          if (t.includes("POLL")) return "#d84826";
          return "#616161"; // Default Gray
        };

        sections.push({
          id: `sec-${Date.now()}-${i}`,
          title: isPriority ? upperText : currentNode.innerHTML,
          content: gatheredContent || "<p></p>",
          color: getColorByTitle(textContent),
        });
      } else {
        sections.push({
          id: `block-${Math.random().toString(36).substr(2, 9)}`,
          title: "CONTENT BLOCK",
          content: currentNode.outerHTML,
          order: sections.length,
        });
      }
    }

    return sections;
  };

  return (
    <div className="uploader-box p-12 border-4 border-dashed border-gray-200 text-center bg-gray-50 hover:bg-white hover:border-amber-400 transition-all cursor-pointer group">
      <input
        type="file"
        id="docx-input"
        className="hidden"
        accept=".docx"
        onChange={handleFileUpload}
      />
      <label htmlFor="docx-input" className="cursor-pointer">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-700">Upload Curriculum</h2>
        <p className="text-gray-400 text-sm mt-2">
          Drop your .docx file here to extract sections
        </p>
      </label>
    </div>
  );
}
