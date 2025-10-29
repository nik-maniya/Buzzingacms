import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { WysiwygEditor } from "./WysiwygEditor";
import { toast } from "sonner@2.0.3";
import { Save, Check } from "lucide-react";

export function Menus() {
  const [headerContent, setHeaderContent] = useState(
    "<nav>\n  <a href='/'>Home</a>\n  <a href='/about'>About</a>\n  <a href='/services'>Services</a>\n  <a href='/contact'>Contact</a>\n</nav>"
  );
  const [footerContent, setFooterContent] = useState(
    "<p>&copy; 2025 Your Company. All rights reserved.</p>\n<p><a href='/privacy'>Privacy Policy</a> | <a href='/terms'>Terms of Service</a></p>"
  );
  const [headerUnsaved, setHeaderUnsaved] = useState(false);
  const [footerUnsaved, setFooterUnsaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isPublished, setIsPublished] = useState(true);

  // Track if there are any unsaved changes
  const hasUnsavedChanges = headerUnsaved || footerUnsaved;

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (hasUnsavedChanges) {
      setAutoSaveStatus("saving");
      
      // Simulate auto-save delay
      setTimeout(() => {
        setHeaderUnsaved(false);
        setFooterUnsaved(false);
        setLastSaved(new Date());
        setAutoSaveStatus("saved");
        setIsPublished(false);
        
        // Reset saved status after 2 seconds
        setTimeout(() => {
          setAutoSaveStatus("idle");
        }, 2000);
      }, 500);
    }
  }, [hasUnsavedChanges]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      autoSave();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoSave]);

  const handleHeaderChange = (value: string) => {
    setHeaderContent(value);
    setHeaderUnsaved(true);
  };

  const handleFooterChange = (value: string) => {
    setFooterContent(value);
    setFooterUnsaved(true);
  };

  const handleSaveDraft = () => {
    setAutoSaveStatus("saving");
    
    // Simulate save delay
    setTimeout(() => {
      setHeaderUnsaved(false);
      setFooterUnsaved(false);
      setLastSaved(new Date());
      setAutoSaveStatus("saved");
      setIsPublished(false);
      toast.success("Menus saved successfully");
      
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 2000);
    }, 500);
  };

  const handlePublish = () => {
    // First save, then publish
    setAutoSaveStatus("saving");
    
    setTimeout(() => {
      setHeaderUnsaved(false);
      setFooterUnsaved(false);
      setLastSaved(new Date());
      setIsPublished(true);
      setAutoSaveStatus("idle");
      toast.success("Menus published");
    }, 500);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-neutral-900">Menus</h2>
            
            {/* Auto-save status */}
            {autoSaveStatus === "saving" && (
              <span className="text-sm text-neutral-500 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-neutral-400 rounded-full animate-pulse" />
                Saving...
              </span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="text-sm text-green-600 flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Last updated */}
            <span className="text-sm text-neutral-500">
              Last updated on {formatDate(lastSaved)}
            </span>

            {/* Save Draft Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={!hasUnsavedChanges}
              className="text-neutral-700 border-neutral-300 hover:bg-neutral-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>

            {/* Publish Button */}
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={!hasUnsavedChanges && isPublished}
              className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
            >
              Publish Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Global Header & Footer:</span> The content you edit here will appear on all published pages across your website. Changes are reflected immediately after publishing.
                </p>
              </div>
            </div>
          </div>

          {/* Header Menu Editor */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-neutral-900">Header</h3>
                  {headerUnsaved && (
                    <span className="flex items-center gap-1.5 text-sm text-orange-600">
                      <span className="inline-block w-1.5 h-1.5 bg-orange-600 rounded-full" />
                      Unsaved
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500">Appears at the top of all pages</p>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                <label className="text-sm text-neutral-700">Header Content</label>
                <div className="min-h-[600px]">
                  <WysiwygEditor
                    value={headerContent}
                    onChange={handleHeaderChange}
                  />
                </div>
              </div>

              <p className="text-sm text-neutral-500 mt-4 leading-relaxed">
                This content will appear inside your website's <code className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-700">{'<header>'}</code> section. You can include navigation links or styled HTML.
              </p>
            </div>
          </div>

          {/* Footer Menu Editor */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-neutral-900">Footer</h3>
                  {footerUnsaved && (
                    <span className="flex items-center gap-1.5 text-sm text-orange-600">
                      <span className="inline-block w-1.5 h-1.5 bg-orange-600 rounded-full" />
                      Unsaved
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500">Appears at the bottom of all pages</p>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                <label className="text-sm text-neutral-700">Footer Content</label>
                <div className="min-h-[600px]">
                  <WysiwygEditor
                    value={footerContent}
                    onChange={handleFooterChange}
                  />
                </div>
              </div>

              <p className="text-sm text-neutral-500 mt-4 leading-relaxed">
                This content will appear in your website's <code className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-700">{'<footer>'}</code> section. You can include text, links, or contact info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
