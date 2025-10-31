import { useEffect, useState } from "react";
import { ArrowLeft, Eye, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CodeEditor } from "./CodeEditor";
import { MetadataPanel } from "./MetadataPanel";
import { WysiwygEditor } from "./WysiwygEditor";
import { PagePreview } from "./PagePreview";

interface PageEditorProps {
  pageId: string;
  onBack: () => void;
}

export function PageEditor({ pageId, onBack }: PageEditorProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [cssCode, setCssCode] = useState(".hero {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  padding: 4rem 2rem;\n  color: white;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n}");
  const [jsCode, setJsCode] = useState("// Page initialization\ndocument.addEventListener('DOMContentLoaded', () => {\n  console.log('Page loaded');\n  \n  // Add smooth scroll\n  document.querySelectorAll('a[href^=\"#\"]').forEach(anchor => {\n    anchor.addEventListener('click', function (e) {\n      e.preventDefault();\n      const target = document.querySelector(this.getAttribute('href'));\n      target?.scrollIntoView({ behavior: 'smooth' });\n    });\n  });\n});");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [previewHeaderHtml, setPreviewHeaderHtml] = useState<string>("");
  const [previewFooterHtml, setPreviewFooterHtml] = useState<string>("");

  // Load page data if editing existing page
  useEffect(() => {
    if (!pageId || pageId === "new") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://localhost:5000";

    setIsLoading(true);
    fetch(`${apiBase}/api/pages/${pageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) throw new Error(res?.message || "Failed to load page");
        const p = res?.data;
        if (!p) return;
        setTitle(p.title || "");
        setSlug(p.slug || "");
        // content can be a JSON object or a plain string in DB
        let htmlContent = "";
        if (typeof p.content === "string") {
          htmlContent = p.content;
        } else if (p.content && typeof p.content === "object") {
          htmlContent = p.content.html || p.content.body || "";
        }
        setContent(typeof htmlContent === "string" ? htmlContent : "");
        if (typeof p.customCss === "string") setCssCode(p.customCss);
        if (typeof p.customJs === "string") setJsCode(p.customJs);
        if (p.status === "PUBLISHED") setStatus("PUBLISHED"); else setStatus("DRAFT");
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [pageId]);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://localhost:5000";

    const normalizedSlug = slug.startsWith("/") ? slug.slice(1) : slug;

    try {
      const isNew = !pageId || pageId === "new";
      const url = isNew ? `${apiBase}/api/pages` : `${apiBase}/api/pages/${pageId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          slug: normalizedSlug,
          content: { html: content },
          customCss: cssCode,
          customJs: jsCode,
          status,
          description: "",
          keywords: [],
          ogImage: undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create page");
      onBack();
    } catch (e) {
      // no-op; could show a toast if available
    }
  };

  // Build preview header/footer dynamically from user-created pages when modal opens
  useEffect(() => {
    if (!showFullPreview) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setPreviewHeaderHtml("");
      setPreviewFooterHtml("");
      return;
    }
    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://localhost:5000";

    fetch(`${apiBase}/api/pages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) throw new Error(res?.message || "Failed to load pages");
        const list = Array.isArray(res?.data) ? res.data : [];
        // Only published pages, sorted by title
        const pages = list
          .filter((p: any) => p?.status === "DRAFT")
          .sort((a: any, b: any) => String(a.title).localeCompare(String(b.title)));
        const navLinks = pages
          .map((p: any) => {
            const s = typeof p.slug === 'string' ? p.slug : '';
            const href = s.startsWith('/') ? s : `/${s}`;
            return `<a href="${href}" style="text-decoration: none;">${p.title}</a>`;
          })
          .join("\n      ");

        const header = `<div style="display: flex; justify-content: space-between; align-items: center;">
    <h2 style="margin: 0; font-size: 24px;">Buzzinga</h2>
    <nav style="display: flex; gap: 24px;">
      ${navLinks}
    </nav>
  </div>`;
        setPreviewHeaderHtml(header);

        const footer = `<div style="text-align: left;">
    <p style="margin-bottom: 8px;">&copy; 2025 Buzzinga. All rights reserved.</p>
  </div>`;
        setPreviewFooterHtml(footer);
      })
      .catch(() => {
        setPreviewHeaderHtml("");
        setPreviewFooterHtml("");
      });
  }, [showFullPreview]);

  const deviceSizes = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const previewSrcDoc = [
    '<!doctype html>',
    '<html>',
    '  <head>',
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <style>${cssCode || ""}</style>`,
    '  </head>',
    '  <body>',
    '    <div style="padding: 2rem">',
    '      <div class="prose" style="max-width:none;color:#171717">' + (content || '') + '</div>',
    '    </div>',
    '    <script>' + (jsCode || '').replace(/<\/script>/g, '<\\/script>') + '<\\/script>',
    '  </body>',
    '</html>'
  ].join('\n');

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-neutral-600 hover:text-neutral-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-neutral-200" />
            <h2 className="text-neutral-900">{title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              onClick={handleSave}
            >
              Save Page
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFullPreview(true)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Full Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-neutral-200 px-8">
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
              <TabsContent value="content" className="h-full m-0 p-8 overflow-auto">
                <div className="max-w-3xl space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="border-neutral-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="border-neutral-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <WysiwygEditor value={content} onChange={setContent} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="css" className="h-full m-0">
                <CodeEditor value={cssCode} onChange={setCssCode} language="css" />
              </TabsContent>

              <TabsContent value="js" className="h-full m-0">
                <CodeEditor value={jsCode} onChange={setJsCode} language="javascript" />
              </TabsContent>

              <TabsContent value="preview" className="h-full m-0 p-8 bg-neutral-50 overflow-auto preview-scrollbar">
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
                    variant={previewDevice === "desktop" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewDevice("desktop")}
                    className={previewDevice === "desktop" ? "bg-neutral-900" : ""}
                  >
                    Desktop
                  </Button>
                  <Button
                    variant={previewDevice === "tablet" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewDevice("tablet")}
                    className={previewDevice === "tablet" ? "bg-neutral-900" : ""}
                  >
                    Tablet
                  </Button>
                  <Button
                    variant={previewDevice === "mobile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewDevice("mobile")}
                    className={previewDevice === "mobile" ? "bg-neutral-900" : ""}
                  >
                    Mobile
                  </Button>
                </div>
                <div className="flex justify-center">
                  <div
                    className="bg-white border border-neutral-200 rounded-lg overflow-auto shadow-lg transition-all preview-scrollbar"
                    style={{ width: deviceSizes[previewDevice], minHeight: "600px", maxHeight: "calc(100vh - 300px)" }}
                  >
                    <iframe
                      title="Live Preview"
                      style={{ width: "100%", height: "100%", border: 0 }}
                      sandbox="allow-scripts allow-same-origin"
                      srcDoc={previewSrcDoc}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Sidebar - Metadata Panel */}
        <MetadataPanel />
      </div>

      {/* Full Page Preview Modal */}
      <PagePreview
        open={showFullPreview}
        onClose={() => setShowFullPreview(false)}
        pageTitle={title}
        pageBody={content}
        headerContent={previewHeaderHtml}
        footerContent={previewFooterHtml}
        customCss={cssCode}
        customJs={jsCode}
      />
    </div>
  );
}
