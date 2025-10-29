import { useState } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { WysiwygEditor } from "./WysiwygEditor";
import { CodeEditor } from "./CodeEditor";
import { ItemMetadataPanel } from "./ItemMetadataPanel";
import { Collection, Item } from "./DynamicPages";

interface ItemEditorProps {
  collection: Collection;
  item: Item | null;
  onBack: () => void;
}

export function ItemEditor({ collection, item, onBack }: ItemEditorProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [title, setTitle] = useState(item?.title || "");
  const [slug, setSlug] = useState(item?.slug || "");
  const [content, setContent] = useState("<h1>Welcome to your new item</h1><p>Start writing your content here...</p>");
  const [cssCode, setCssCode] = useState(".content {\n  padding: 2rem;\n  max-width: 800px;\n  margin: 0 auto;\n}");
  const [jsCode, setJsCode] = useState("// Item initialization\nconsole.log('Item loaded');");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const deviceSizes = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!item) {
      // Auto-generate slug from title for new items
      const autoSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(autoSlug);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-neutral-200" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">{collection.icon}</span>
              <h2 className="text-neutral-900">
                {item ? `Edit: ${item.title}` : `New ${collection.name} Item`}
              </h2>
            </div>
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

            <div className="flex-1 overflow-hidden">
              <TabsContent value="content" className="h-full m-0 p-8 overflow-auto">
                <div className="max-w-3xl space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter item title..."
                      className="border-neutral-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-500">{collection.slugPrefix}</span>
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="url-slug"
                        className="border-neutral-200 flex-1"
                      />
                    </div>
                  </div>

                  {/* Dynamic Fields Based on Collection */}
                  {collection.fields
                    .filter((field) => field.name !== "Title" && field.name !== "Slug")
                    .map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                          {field.name}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {field.type === "longtext" && field.name.toLowerCase().includes("body") ? (
                          <WysiwygEditor value={content} onChange={setContent} />
                        ) : field.type === "longtext" ? (
                          <Input
                            id={field.id}
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            className="border-neutral-200"
                          />
                        ) : field.type === "image" ? (
                          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-neutral-400 transition-colors cursor-pointer">
                            <p className="text-sm text-neutral-500">Click to upload or drag and drop</p>
                          </div>
                        ) : field.type === "tags" ? (
                          <Input
                            id={field.id}
                            placeholder="Add tags (comma separated)..."
                            className="border-neutral-200"
                          />
                        ) : (
                          <Input
                            id={field.id}
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            className="border-neutral-200"
                          />
                        )}
                      </div>
                    ))}
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
                      <h1 className="mb-4 text-neutral-900">{title || "Untitled Item"}</h1>
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
        <ItemMetadataPanel item={item} />
      </div>
    </div>
  );
}
