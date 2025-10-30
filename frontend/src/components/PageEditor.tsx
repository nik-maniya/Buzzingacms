import { useState } from "react";
import { ArrowLeft, Eye, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
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
  const [title, setTitle] = useState("Home");
  const [slug, setSlug] = useState("/home");
  const [content, setContent] = useState("<h1>Welcome to Buzzinga</h1><p>This is your homepage content. You can format text with the toolbar above.</p>");
  const [cssCode, setCssCode] = useState(".hero {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  padding: 4rem 2rem;\n  color: white;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n}");
  const [jsCode, setJsCode] = useState("// Page initialization\ndocument.addEventListener('DOMContentLoaded', () => {\n  console.log('Page loaded');\n  \n  // Add smooth scroll\n  document.querySelectorAll('a[href^=\"#\"]').forEach(anchor => {\n    anchor.addEventListener('click', function (e) {\n      e.preventDefault();\n      const target = document.querySelector(this.getAttribute('href'));\n      target?.scrollIntoView({ behavior: 'smooth' });\n    });\n  });\n});");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Mock header/footer content from Menus module
  const mockHeaderContent = `<div style="display: flex; justify-content: space-between; align-items: center;">
    <h2 style="margin: 0; font-size: 24px;">Buzzinga</h2>
    <nav style="display: flex; gap: 24px;">
      <a href="/" style="text-decoration: none;">Home</a>
      <a href="/about" style="text-decoration: none;">About</a>
      <a href="/services" style="text-decoration: none;">Services</a>
      <a href="/contact" style="text-decoration: none;">Contact</a>
    </nav>
  </div>`;

  const mockFooterContent = `<div style="text-align: left;">
    <p style="margin-bottom: 8px;">&copy; 2025 Buzzinga. All rights reserved.</p>
    <div style="display: flex; gap: 16px; margin-top: 12px;">
      <a href="/privacy" style="text-decoration: none;">Privacy Policy</a>
      <a href="/terms" style="text-decoration: none;">Terms of Service</a>
      <a href="mailto:hello@buzzinga.com" style="text-decoration: none;">hello@buzzinga.com</a>
    </div>
  </div>`;

  const deviceSizes = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

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

              <TabsContent value="preview" className="h-full m-0 p-8 bg-neutral-50 overflow-auto">
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
                    className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-lg transition-all"
                    style={{ width: deviceSizes[previewDevice], minHeight: "600px" }}
                  >
                    <div className="p-8">
                      <h1 className="mb-4 text-neutral-900">{title}</h1>
                      <div 
                        className="prose prose-neutral max-w-none"
                        dangerouslySetInnerHTML={{ __html: content }}
                      />
                    </div>
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
        headerContent={mockHeaderContent}
        footerContent={mockFooterContent}
      />
    </div>
  );
}
