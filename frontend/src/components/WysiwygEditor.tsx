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
  const [htmlValue, setHtmlValue] = useState(value || "");
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingFromExternalRef = useRef(false);
  const lastSyncedValueRef = useRef<string>("");

  // Initialize Quill editor
  useEffect(() => {
    
    if (editorRef.current && !quillRef.current) {
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

      // Set initial content if available
      const initialValue = value || "";
      setHtmlValue(initialValue);
      lastSyncedValueRef.current = initialValue;
      
      // Use Quill's clipboard API to set initial content properly
      if (initialValue) {
        const delta = quillRef.current.clipboard.convert({ html: initialValue });
        quillRef.current.setContents(delta, 'silent');
      }

      // Listen for Quill changes
      quillRef.current.on("text-change", () => {
        if (quillRef.current && !isUpdatingFromExternalRef.current) {
          let html = quillRef.current.root.innerHTML;
          // Normalize empty Quill content
          if (html.trim() === "<p><br></p>" || html.trim() === "<p></p>") {
            html = "";
          }
          setHtmlValue(html);
          onChange(html);
          lastSyncedValueRef.current = html;
        }
      });
    }
  }, []);

  // Sync external value prop changes (e.g., when page loads)
  useEffect(() => {
    const normalizedValue = value || "";
    
    // Skip if already synced (unless it's an external change that should override)
    if (lastSyncedValueRef.current === normalizedValue) {
      return;
    }

    isUpdatingFromExternalRef.current = true;
    setHtmlValue(normalizedValue);
    lastSyncedValueRef.current = normalizedValue;

    // Update Quill if in visual mode and Quill is ready
    if (quillRef.current && mode === "visual") {
      const current = quillRef.current.root.innerHTML;
      // Normalize comparison - Quill might add <p><br></p> for empty content
      const currentNormalized = current.trim() === "<p><br></p>" || current.trim() === "" ? "" : current;
      const valueNormalized = normalizedValue.trim() === "" ? "" : normalizedValue;
      
      if (currentNormalized !== valueNormalized) {
        const contentToSet = normalizedValue.trim() === "" ? "<p><br></p>" : normalizedValue;
        const delta = quillRef.current.clipboard.convert({ html: contentToSet });
        quillRef.current.setContents(delta, 'silent');
      }
    }

    // Reset flag after a delay
    setTimeout(() => {
      isUpdatingFromExternalRef.current = false;
    }, 100);
  }, [value, mode]);

  // Update Quill when switching back to visual mode from HTML mode
  useEffect(() => {
    if (mode === "visual" && quillRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      const htmlValueNormalized = htmlValue.trim() === "" ? "" : htmlValue;
      const currentNormalized = currentContent.trim() === "<p><br></p>" || currentContent.trim() === "" ? "" : currentContent;
      
      // Only update if content is different
      if (currentNormalized !== htmlValueNormalized) {
        isUpdatingFromExternalRef.current = true;
        
        // Wait for the element to be visible, then use Quill's clipboard API
        // This ensures the content is properly parsed by Quill
        setTimeout(() => {
          if (quillRef.current) {
            const contentToSet = htmlValue.trim() === "" ? "<p><br></p>" : htmlValue;
            // Use Quill's clipboard API to properly set HTML content
            const delta = quillRef.current.clipboard.convert({ html: contentToSet });
            quillRef.current.setContents(delta, 'silent');
            
            setTimeout(() => {
              isUpdatingFromExternalRef.current = false;
            }, 50);
          }
        }, 50);
      }
    }
  }, [mode, htmlValue]);

  const handleHtmlChange = (newHtml: string) => {
    setHtmlValue(newHtml);
    onChange(newHtml);
    lastSyncedValueRef.current = newHtml;
  };

  const handleModeSwitch = (newMode: "visual" | "html") => {
    if (newMode === "html") {
      // Switching to HTML mode: save current Quill content
      if (quillRef.current) {
        let quillContent = quillRef.current.root.innerHTML;
        // Normalize empty Quill content (Quill uses <p><br></p> for empty)
        if (quillContent.trim() === "<p><br></p>" || quillContent.trim() === "<p></p>") {
          quillContent = "";
        }
        setHtmlValue(quillContent);
        lastSyncedValueRef.current = quillContent;
      }
    } else {
      // Switching to Visual mode: Quill will be updated by the useEffect above
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

      {/* Keep both mounted; toggle visibility so Quill isn't destroyed when switching modes */}
      <div className={mode === "visual" ? "block" : "hidden"}>
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          <div ref={editorRef} className="min-h-[500px]" />
        </div>
      </div>
      <div className={mode === "html" ? "block" : "hidden"}>
        <textarea
          value={htmlValue}
          onChange={(e) => handleHtmlChange(e.target.value)}
          className="min-h-[500px] p-4 border border-neutral-200 rounded-lg bg-white font-mono text-sm outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent w-full resize-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
