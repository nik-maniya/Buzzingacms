import { useState, useEffect } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { WysiwygEditor } from "./WysiwygEditor";
import { CodeEditor } from "./CodeEditor";
import { ItemMetadataPanel } from "./ItemMetadataPanel";
import { Collection, Item, Field } from "./DynamicPages";
import { collectionFieldsAPI, collectionItemsAPI } from "../services/api";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "sonner";

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
  const [fields, setFields] = useState<Field[]>(collection.fields);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<"draft" | "published">(item?.status || "draft");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch latest fields from API when component loads or collection changes
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await collectionFieldsAPI.getAll(collection.id);
        if (response.data.success) {
          const apiFields = response.data.data || [];
          const transformedFields = apiFields.map((apiField: any) => {
            // Parse options from defaultValue if it's JSON
            let options: string[] = [];
            if (apiField.defaultValue) {
              try {
                const parsed = JSON.parse(apiField.defaultValue);
                if (Array.isArray(parsed)) {
                  options = parsed;
                }
              } catch (e) {
                // Not JSON, keep as empty array
              }
            }

            return {
              id: apiField.id,
              name: apiField.fieldLabel,
              type: apiField.fieldType as Field["type"],
              required: apiField.required || false,
              options: options,
            };
          });
          setFields(transformedFields);
        }
      } catch (error) {
        console.error("Error fetching fields:", error);
        // Fallback to collection.fields if API fails
        setFields(collection.fields);
      }
    };

    fetchFields();
  }, [collection.id]);

  // Load item data when editing
  useEffect(() => {
    if (item) {
      setTitle(item.title || "");
      setSlug(item.slug || "");
      setStatus(item.status || "draft");
      if (item.fields) {
        setFieldValues(item.fields);
        if (item.fields.content) setContent(item.fields.content);
        if (item.fields.css) setCssCode(item.fields.css);
        if (item.fields.js) setJsCode(item.fields.js);
      }
    } else {
      // Reset for new item
      setTitle("");
      setSlug("");
      setStatus("draft");
      setFieldValues({});
      setContent("<h1>Welcome to your new item</h1><p>Start writing your content here...</p>");
      setCssCode(".content {\n  padding: 2rem;\n  max-width: 800px;\n  margin: 0 auto;\n}");
      setJsCode("// Item initialization\nconsole.log('Item loaded');");
    }
  }, [item]);

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

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Prepare data object with all field values
      const itemData: Record<string, any> = {
        title,
        slug,
        content,
        css: cssCode,
        js: jsCode,
        ...fieldValues,
      };

      if (item) {
        // Update existing item
        const response = await collectionItemsAPI.update(item.id, {
          data: itemData,
          status,
        });
        if (response.data.success) {
          toast.success("Item saved successfully!");
          onBack(); // Go back to list
        }
      } else {
        // Create new item
        const response = await collectionItemsAPI.create({
          collectionId: collection.id,
          data: itemData,
          status,
        });
        if (response.data.success) {
          toast.success("Item created successfully!");
          onBack(); // Go back to list
        }
      }
    } catch (error: any) {
      console.error("Error saving item:", error);
      toast.error(error.response?.data?.message || "Failed to save item");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
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
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="border border-neutral-200 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <Button
              onClick={handleSave}
              className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
              disabled={isSaving || !title.trim()}
            >
              {isSaving ? "Saving..." : item ? "Save Changes" : "Create Item"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-y-auto">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            {/* <div className="border-b border-neutral-200 px-8">
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
            </div> */}

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
                  {fields
                    .filter((field) => field.name !== "Title" && field.name !== "Slug")
                    .map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                          {field.name}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {field.type === "longtext" && field.name.toLowerCase().includes("body") ? (
                          <WysiwygEditor 
                            value={fieldValues[field.id] || content} 
                            onChange={(value) => {
                              setContent(value);
                              handleFieldChange(field.id, value);
                            }} 
                          />
                        ) : field.type === "longtext" ? (
                          <textarea
                            id={field.id}
                            rows={4}
                            value={fieldValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            className="border border-neutral-200 rounded-md p-2 w-full"
                          />
                        ) : field.type === "image" ? (
                          <input
                            id={field.id}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFieldChange(field.id, file.name);
                            }}
                            className="border border-neutral-200 rounded-md h-10 px-3 py-1"
                          />
                        ) : field.type === "boolean" ? (
                          <div className="flex items-center gap-2">
                            <input
                              id={field.id}
                              type="checkbox"
                              checked={fieldValues[field.id] || false}
                              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm text-neutral-700">{`Toggle ${field.name.toLowerCase()}`}</span>
                          </div>
                        ) : field.type === "date" ? (
                          <Input
                            id={field.id}
                            type="date"
                            value={fieldValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="border-neutral-200"
                          />
                        ) : field.type === "tags" ? (
                          <Input
                            id={field.id}
                            value={fieldValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder="Add tags (comma separated)..."
                            className="border-neutral-200"
                          />
                        ) : field.type === "dropdown" ? (
                          <select
                            id={field.id}
                            value={fieldValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="border border-neutral-200 rounded-md h-10 px-3 w-full"
                          >
                            <option value="" disabled>
                              {`Select ${field.name.toLowerCase()}`}
                            </option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "text" ? (
                          <Input
                            id={field.id}
                            type="text"
                            value={fieldValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            className="border-neutral-200"
                          />
                        ) : field.type === "radio" ? (
                          <RadioGroup
                            value={fieldValues[field.id] || ""}
                            onValueChange={(value) => handleFieldChange(field.id, value)}
                            className="flex flex-col gap-2"
                          >
                            {(field.options || []).map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                                <Label
                                  htmlFor={`${field.id}-${opt}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {opt}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : (
                          <Input
                            id={field.id}
                            value={fieldValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
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
