import { useRef } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "css" | "javascript" | "html";
  height?: number | string;
}

export function CodeEditor({ value, onChange, language, height }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLight = language === "html";

  return (
    <>
      <style>{`
        .code-editor-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .code-editor-scrollbar::-webkit-scrollbar-track {
          background: ${isLight ? "#f5f5f5" : "#2d2d2d"};
          border-radius: 5px;
        }
        .code-editor-scrollbar::-webkit-scrollbar-thumb {
          background: ${isLight ? "#d4d4d4" : "#525252"};
          border-radius: 5px;
        }
        .code-editor-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isLight ? "#a3a3a3" : "#6b6b6b"};
        }
        .code-editor-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${isLight ? "#d4d4d4 #f5f5f5" : "#525252 #2d2d2d"};
        }
      `}</style>
      <div
        className={`w-full overflow-auto code-editor-scrollbar ${isLight ? "bg-white border border-neutral-200" : "bg-[#1e1e1e]"}`}
        style={{ height: height ?? "70vh", minHeight: 600 }}
      >
        <div className="h-full p-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full h-full font-mono text-sm outline-none resize-none overflow-auto code-editor-scrollbar ${isLight ? "bg-white text-[#111111]" : "bg-transparent text-[#d4d4d4]"}`}
            style={{
              lineHeight: "1.6",
              tabSize: 2,
              whiteSpace: "pre",
              overflowWrap: "normal",
            }}
            spellCheck={false}
          />
        </div>
      </div>
    </>
  );
}
