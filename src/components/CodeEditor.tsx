import { useEffect, useRef } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "css" | "javascript";
}

export function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <div className="h-full bg-[#1e1e1e] overflow-auto">
      <div className="min-h-full p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[calc(100vh-200px)] bg-transparent text-[#d4d4d4] font-mono text-sm outline-none resize-none"
          style={{
            lineHeight: "1.6",
            tabSize: 2,
            whiteSpace: "pre",
            overflowWrap: "normal",
            overflowX: "auto",
          }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
