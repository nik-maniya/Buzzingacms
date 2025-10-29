import { useState, useEffect, useRef } from "react";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote
} from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Toggle } from "./ui/toggle";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function WysiwygEditor({ value, onChange }: WysiwygEditorProps) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [htmlValue, setHtmlValue] = useState(value);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "visual" && editorRef.current) {
      editorRef.current.innerHTML = htmlValue;
    }
  }, [mode]);

  const handleInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setHtmlValue(newHtml);
      onChange(newHtml);
    }
  };

  const handleHtmlChange = (newHtml: string) => {
    setHtmlValue(newHtml);
    onChange(newHtml);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertHeading = (level: number) => {
    execCommand("formatBlock", `h${level}`);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <div className="flex gap-1">
          <Button
            variant={mode === "visual" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("visual")}
            className={mode === "visual" ? "bg-neutral-900 text-white" : "text-neutral-600"}
          >
            Visual
          </Button>
          <Button
            variant={mode === "html" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("html")}
            className={mode === "html" ? "bg-neutral-900 text-white" : "text-neutral-600"}
          >
            HTML
          </Button>
        </div>
      </div>

      {mode === "visual" ? (
        <>
          {/* Toolbar */}
          <div className="border border-neutral-200 rounded-lg p-2 bg-neutral-50 flex flex-wrap gap-1">
            <Toggle
              size="sm"
              onPressedChange={() => insertHeading(1)}
              className="data-[state=on]:bg-neutral-200"
            >
              <Heading1 className="w-4 h-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => insertHeading(2)}
              className="data-[state=on]:bg-neutral-200"
            >
              <Heading2 className="w-4 h-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => insertHeading(3)}
              className="data-[state=on]:bg-neutral-200"
            >
              <Heading3 className="w-4 h-4" />
            </Toggle>

            <Separator orientation="vertical" className="h-8 bg-neutral-300" />

            <Toggle
              size="sm"
              onPressedChange={() => execCommand("bold")}
              className="data-[state=on]:bg-neutral-200"
            >
              <Bold className="w-4 h-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => execCommand("italic")}
              className="data-[state=on]:bg-neutral-200"
            >
              <Italic className="w-4 h-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => execCommand("underline")}
              className="data-[state=on]:bg-neutral-200"
            >
              <Underline className="w-4 h-4" />
            </Toggle>

            <Separator orientation="vertical" className="h-8 bg-neutral-300" />

            <Toggle
              size="sm"
              onPressedChange={() => execCommand("insertUnorderedList")}
              className="data-[state=on]:bg-neutral-200"
            >
              <List className="w-4 h-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => execCommand("insertOrderedList")}
              className="data-[state=on]:bg-neutral-200"
            >
              <ListOrdered className="w-4 h-4" />
            </Toggle>

            <Separator orientation="vertical" className="h-8 bg-neutral-300" />

            <Toggle
              size="sm"
              onPressedChange={() => execCommand("formatBlock", "blockquote")}
              className="data-[state=on]:bg-neutral-200"
            >
              <Quote className="w-4 h-4" />
            </Toggle>
            <Toggle
              size="sm"
              onPressedChange={() => execCommand("formatBlock", "pre")}
              className="data-[state=on]:bg-neutral-200"
            >
              <Code className="w-4 h-4" />
            </Toggle>

            <Separator orientation="vertical" className="h-8 bg-neutral-300" />

            <Button
              variant="ghost"
              size="sm"
              onClick={insertLink}
              className="h-8"
            >
              <Link className="w-4 h-4" />
            </Button>
          </div>

          {/* Visual Editor */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="min-h-[400px] p-4 border border-neutral-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent prose prose-neutral max-w-none"
            style={{
              lineHeight: "1.6",
            }}
          />
        </>
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
