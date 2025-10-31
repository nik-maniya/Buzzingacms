import { useRef } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "css" | "javascript";
}

export function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <style>{`
        .code-editor-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .code-editor-scrollbar::-webkit-scrollbar-track {
          background: #2d2d2d;
          border-radius: 5px;
        }
        .code-editor-scrollbar::-webkit-scrollbar-thumb {
          background: #525252;
          border-radius: 5px;
        }
        .code-editor-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b6b6b;
        }
        .code-editor-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #525252 #2d2d2d;
        }
      `}</style>
      <div className="h-full bg-[#1e1e1e] overflow-auto code-editor-scrollbar">
        <div className="h-full p-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full bg-transparent text-[#d4d4d4] font-mono text-sm outline-none resize-none overflow-auto code-editor-scrollbar"
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
