import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function WysiwygEditor({ value, onChange }: WysiwygEditorProps) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [htmlValue, setHtmlValue] = useState(value);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Initialize Quill
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["blockquote", "code-block"],
            [{ align: [] }],
            ["link", "image"],
            ["clean"],
          ],
        },
        placeholder: "Write your content here...",
      });

      // Set initial content
      if (value) {
        quillRef.current.root.innerHTML = value;
      }

      // Listen for changes
      quillRef.current.on("text-change", () => {
        if (quillRef.current) {
          const html = quillRef.current.root.innerHTML;
          setHtmlValue(html);
          onChange(html);
        }
      });
    }
  }, []);

  useEffect(() => {
    // Update Quill content when switching back from HTML mode
    if (mode === "visual" && quillRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      if (currentContent !== htmlValue) {
        quillRef.current.root.innerHTML = htmlValue;
      }
    }
  }, [mode]);

  const handleHtmlChange = (newHtml: string) => {
    setHtmlValue(newHtml);
    onChange(newHtml);
  };

  const handleModeSwitch = (newMode: "visual" | "html") => {
    if (newMode === "html" && quillRef.current) {
      // Save current Quill content before switching to HTML mode
      setHtmlValue(quillRef.current.root.innerHTML);
    }
    setMode(newMode);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <div className="flex gap-1">
          <Button
            variant={mode === "visual" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleModeSwitch("visual")}
            className={mode === "visual" ? "bg-neutral-900 text-white" : "text-neutral-600"}
          >
            Visual
          </Button>
          <Button
            variant={mode === "html" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleModeSwitch("html")}
            className={mode === "html" ? "bg-neutral-900 text-white" : "text-neutral-600"}
          >
            HTML
          </Button>
        </div>
      </div>

      {mode === "visual" ? (
        /* Quill Editor */
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          <div ref={editorRef} className="min-h-[500px]" />
        </div>
      ) : (
        /* HTML Editor */
        <textarea
          value={htmlValue}
          onChange={(e) => handleHtmlChange(e.target.value)}
          className="min-h-[500px] p-4 border border-neutral-200 rounded-lg bg-white font-mono text-sm outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent w-full resize-none"
          spellCheck={false}
        />
      )}
    </div>
  );
}
