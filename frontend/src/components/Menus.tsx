import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { WysiwygEditor } from "./WysiwygEditor";
import { CodeEditor } from "./CodeEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { Save, Check, Eye } from "lucide-react";

export function Menus() {
  const [headerContent, setHeaderContent] = useState(
    "<nav>\n  <a href='/'>Home</a>\n  <a href='/about'>About</a>\n  <a href='/services'>Services</a>\n  <a href='/contact'>Contact</a>\n</nav>"
  );
  const [headerCss, setHeaderCss] = useState("");
  const [headerJs, setHeaderJs] = useState("");
  const [headerActiveTab, setHeaderActiveTab] = useState("content");
  const [headerPreviewDevice, setHeaderPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  
  const [footerContent, setFooterContent] = useState(
    "<p>&copy; 2025 Your Company. All rights reserved.</p>\n<p><a href='/privacy'>Privacy Policy</a> | <a href='/terms'>Terms of Service</a></p>"
  );
  const [footerCss, setFooterCss] = useState("");
  const [footerJs, setFooterJs] = useState("");
  const [footerActiveTab, setFooterActiveTab] = useState("content");
  const [footerPreviewDevice, setFooterPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  
  const [headerUnsaved, setHeaderUnsaved] = useState(false);
  const [footerUnsaved, setFooterUnsaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isPublished, setIsPublished] = useState(true);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track if there are any unsaved changes
  const hasUnsavedChanges = headerUnsaved || footerUnsaved;

  // Load existing menu on mount
  useEffect(() => {
    const loadMenu = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const apiBase = (import.meta as any).env?.VITE_API_URL
        ? (import.meta as any).env.VITE_API_URL
        : "http://mycms.test:3000";

      try {
        // Always load the list initially to avoid calling getMenuById with null
        const resp = await fetch(`${apiBase}/api/menus/getAllmenu`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await resp.json();
        if (resp.ok && json.data) {
          const menus = Array.isArray(json.data) ? json.data : [];
          // Prefer a global menu, then header/footer, else the first
          const menu = menus.find((m: any) => m.location === "global")
            || menus.find((m: any) => m.location === "header" || m.location === "footer")
            || menus[0];

          if (menu) {
            setMenuId(menu.id);

            // Load header data
            if (menu.header && typeof menu.header === 'object') {
              setHeaderContent(menu.header.html || menu.header.content || headerContent);
              setHeaderCss(menu.header.css || "");
              setHeaderJs(menu.header.js || "");
            }

            // Load footer data
            if (menu.footer && typeof menu.footer === 'object') {
              setFooterContent(menu.footer.html || menu.footer.content || footerContent);
              setFooterCss(menu.footer.css || "");
              setFooterJs(menu.footer.js || "");
            }

            if (menu.updatedAt) {
              setLastSaved(new Date(menu.updatedAt));
            }
          }
        }
      } catch (error) {
        console.error("Failed to load menu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMenu();
  }, []);

  const saveMenu = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to save menus");
      return;
    }

    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://mycms.test:3000";

    const menuData = {
      name: "Global Menu",
      slug: "global-menu",
      location: "global",
      items: [],
      header: {
        html: headerContent,
        css: headerCss,
        js: headerJs,
      },
      footer: {
        html: footerContent,
        css: footerCss,
        js: footerJs,
      },
    };

    try {
      let response;
      if (menuId) {
        // Update existing menu
        response = await fetch(`${apiBase}/api/menus/updateMenu/${menuId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(menuData),
        });
      } else {
        // Create new menu
        response = await fetch(`${apiBase}/api/menus/cerateMenu`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(menuData),
        });
      }

      const res = await response.json();
      
      if (!response.ok) {
        throw new Error(res?.message || "Failed to save menu");
      }

      // Update menu ID if it's a new menu
      if (!menuId && res.data?.id) {
        setMenuId(res.data.id);
      }

      return res;
    } catch (error: any) {
      console.error("Save error:", error);
      throw error;
    }
  }, [menuId, headerContent, headerCss, headerJs, footerContent, footerCss, footerJs]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (hasUnsavedChanges) {
      setAutoSaveStatus("saving");
      
      try {
        await saveMenu();
        setHeaderUnsaved(false);
        setFooterUnsaved(false);
        setLastSaved(new Date());
        setAutoSaveStatus("saved");
        setIsPublished(false);
        
        // Reset saved status after 2 seconds
        setTimeout(() => {
          setAutoSaveStatus("idle");
        }, 2000);
      } catch (error) {
        setAutoSaveStatus("idle");
        console.error("Auto-save failed:", error);
      }
    }
  }, [hasUnsavedChanges, saveMenu]);

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

  const handleHeaderCssChange = (value: string) => {
    setHeaderCss(value);
    setHeaderUnsaved(true);
  };

  const handleHeaderJsChange = (value: string) => {
    setHeaderJs(value);
    setHeaderUnsaved(true);
  };

  const handleFooterChange = (value: string) => {
    setFooterContent(value);
    setFooterUnsaved(true);
  };

  const handleFooterCssChange = (value: string) => {
    setFooterCss(value);
    setFooterUnsaved(true);
  };

  const handleFooterJsChange = (value: string) => {
    setFooterJs(value);
    setFooterUnsaved(true);
  };

  const handleSaveDraft = async () => {
    setAutoSaveStatus("saving");
    
    try {
      await saveMenu();
      setHeaderUnsaved(false);
      setFooterUnsaved(false);
      setLastSaved(new Date());
      setAutoSaveStatus("saved");
      setIsPublished(false);
      toast.success("Menus saved successfully");
      
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 2000);
    } catch (error: any) {
      setAutoSaveStatus("idle");
      toast.error(error?.message || "Failed to save menus");
    }
  };

  const handlePublish = async () => {
    setAutoSaveStatus("saving");
    
    try {
      await saveMenu();
      setHeaderUnsaved(false);
      setFooterUnsaved(false);
      setLastSaved(new Date());
      setIsPublished(true);
      setAutoSaveStatus("idle");
      toast.success("Menus published successfully");
    } catch (error: any) {
      setAutoSaveStatus("idle");
      toast.error(error?.message || "Failed to publish menus");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const deviceSizes = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  // Escape script tags in JS code
  const escapeJs = (jsCode: string) => (jsCode || '').replace(/<\/script>/gi, '<\\/script>');
  
  // Header preview srcDoc
  const headerPreviewSrcDoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${headerCss || ""}</style>
  </head>
  <body>
    <div style="padding: 2rem">
      ${headerContent || ''}
    </div>
    <script>
      (function() {
        ${escapeJs(headerJs)}
        
        // Ensure DOMContentLoaded event fires for any listeners
        if (document.readyState !== 'loading') {
          setTimeout(function() {
            var evt;
            try {
              evt = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
            } catch(e) {
              evt = document.createEvent('Event');
              evt.initEvent('DOMContentLoaded', true, true);
            }
            document.dispatchEvent(evt);
            window.dispatchEvent(evt);
          }, 0);
        }
      })();
    </script>
  </body>
</html>`;

  // Footer preview srcDoc
  const footerPreviewSrcDoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${footerCss || ""}</style>
  </head>
  <body>
    <div style="padding: 2rem">
      ${footerContent || ''}
    </div>
    <script>
      (function() {
        ${escapeJs(footerJs)}
        
        // Ensure DOMContentLoaded event fires for any listeners
        if (document.readyState !== 'loading') {
          setTimeout(function() {
            var evt;
            try {
              evt = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
            } catch(e) {
              evt = document.createEvent('Event');
              evt.initEvent('DOMContentLoaded', true, true);
            }
            document.dispatchEvent(evt);
            window.dispatchEvent(evt);
          }, 0);
        }
      })();
    </script>
  </body>
</html>`;

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

            <div className="p-0">
              <Tabs value={headerActiveTab} onValueChange={setHeaderActiveTab} className="flex-1 flex flex-col">
                <div className="border-b border-neutral-200 px-6">
                  <TabsList className="bg-transparent h-12 p-0 space-x-1">
                    <TabsTrigger
                      value="content"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                    >
                      Content
                    </TabsTrigger>
                    <TabsTrigger
                      value="css"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                    >
                      CSS
                    </TabsTrigger>
                    <TabsTrigger
                      value="js"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                    >
                      JS
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto">
                  <TabsContent value="content" className="h-full m-0 p-6 overflow-auto">
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
                  </TabsContent>

                  <TabsContent value="css" className="h-full m-0">
                    <CodeEditor value={headerCss} onChange={handleHeaderCssChange} language="css" />
                  </TabsContent>

                  <TabsContent value="js" className="h-full m-0">
                    <CodeEditor value={headerJs} onChange={handleHeaderJsChange} language="javascript" />
                  </TabsContent>

                  <TabsContent value="preview" className="h-full m-0 p-6 bg-neutral-50 overflow-auto preview-scrollbar">
                    <style>{`
                      .preview-scrollbar::-webkit-scrollbar {
                        width: 10px;
                        height: 10px;
                      }
                      .preview-scrollbar::-webkit-scrollbar-track {
                        background: #f5f5f5;
                        border-radius: 5px;
                      }
                      .preview-scrollbar::-webkit-scrollbar-thumb {
                        background: #d4d4d4;
                        border-radius: 5px;
                      }
                      .preview-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #a3a3a3;
                      }
                      .preview-scrollbar {
                        scrollbar-width: thin;
                        scrollbar-color: #d4d4d4 #f5f5f5;
                      }
                    `}</style>
                    <div className="mb-4 flex items-center justify-center gap-2">
                      <Button
                        variant={headerPreviewDevice === "desktop" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHeaderPreviewDevice("desktop")}
                        className={headerPreviewDevice === "desktop" ? "bg-neutral-900" : ""}
                      >
                        Desktop
                      </Button>
                      <Button
                        variant={headerPreviewDevice === "tablet" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHeaderPreviewDevice("tablet")}
                        className={headerPreviewDevice === "tablet" ? "bg-neutral-900" : ""}
                      >
                        Tablet
                      </Button>
                      <Button
                        variant={headerPreviewDevice === "mobile" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHeaderPreviewDevice("mobile")}
                        className={headerPreviewDevice === "mobile" ? "bg-neutral-900" : ""}
                      >
                        Mobile
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <div
                        className="bg-white border border-neutral-200 rounded-lg overflow-auto shadow-lg transition-all preview-scrollbar"
                        style={{ width: deviceSizes[headerPreviewDevice], minHeight: "600px", maxHeight: "calc(100vh - 300px)" }}
                      >
                        <iframe
                          title="Header Preview"
                          style={{ width: "100%", height: "100%", border: 0 }}
                          sandbox="allow-scripts allow-same-origin"
                          srcDoc={headerPreviewSrcDoc}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
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

            <div className="p-0">
              <Tabs value={footerActiveTab} onValueChange={setFooterActiveTab} className="flex-1 flex flex-col">
                <div className="border-b border-neutral-200 px-6">
                  <TabsList className="bg-transparent h-12 p-0 space-x-1">
                    <TabsTrigger
                      value="content"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                    >
                      Content
                    </TabsTrigger>
                    <TabsTrigger
                      value="css"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                    >
                      CSS
                    </TabsTrigger>
                    <TabsTrigger
                      value="js"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                    >
                      JS
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto">
                  <TabsContent value="content" className="h-full m-0 p-6 overflow-auto">
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
                  </TabsContent>

                  <TabsContent value="css" className="h-full m-0">
                    <CodeEditor value={footerCss} onChange={handleFooterCssChange} language="css" />
                  </TabsContent>

                  <TabsContent value="js" className="h-full m-0">
                    <CodeEditor value={footerJs} onChange={handleFooterJsChange} language="javascript" />
                  </TabsContent>

                  <TabsContent value="preview" className="h-full m-0 p-6 bg-neutral-50 overflow-auto preview-scrollbar">
                    <style>{`
                      .preview-scrollbar::-webkit-scrollbar {
                        width: 10px;
                        height: 10px;
                      }
                      .preview-scrollbar::-webkit-scrollbar-track {
                        background: #f5f5f5;
                        border-radius: 5px;
                      }
                      .preview-scrollbar::-webkit-scrollbar-thumb {
                        background: #d4d4d4;
                        border-radius: 5px;
                      }
                      .preview-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #a3a3a3;
                      }
                      .preview-scrollbar {
                        scrollbar-width: thin;
                        scrollbar-color: #d4d4d4 #f5f5f5;
                      }
                    `}</style>
                    <div className="mb-4 flex items-center justify-center gap-2">
                      <Button
                        variant={footerPreviewDevice === "desktop" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFooterPreviewDevice("desktop")}
                        className={footerPreviewDevice === "desktop" ? "bg-neutral-900" : ""}
                      >
                        Desktop
                      </Button>
                      <Button
                        variant={footerPreviewDevice === "tablet" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFooterPreviewDevice("tablet")}
                        className={footerPreviewDevice === "tablet" ? "bg-neutral-900" : ""}
                      >
                        Tablet
                      </Button>
                      <Button
                        variant={footerPreviewDevice === "mobile" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFooterPreviewDevice("mobile")}
                        className={footerPreviewDevice === "mobile" ? "bg-neutral-900" : ""}
                      >
                        Mobile
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <div
                        className="bg-white border border-neutral-200 rounded-lg overflow-auto shadow-lg transition-all preview-scrollbar"
                        style={{ width: deviceSizes[footerPreviewDevice], minHeight: "600px", maxHeight: "calc(100vh - 300px)" }}
                      >
                        <iframe
                          title="Footer Preview"
                          style={{ width: "100%", height: "100%", border: 0 }}
                          sandbox="allow-scripts allow-same-origin"
                          srcDoc={footerPreviewSrcDoc}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
