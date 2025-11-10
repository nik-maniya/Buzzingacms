import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Copy, Save, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Collection, Item, Field } from "./DynamicPages";
import { CollectionItemsList } from "./CollectionItemsList";
import { FieldsStructure } from "./FieldsStructure";
import { CollectionSettings } from "./CollectionSettings";
import { CodeEditor, CodeEditorRef } from "./CodeEditor";
import { toast } from "sonner";
import { collectionFieldsAPI, pageTemplatesAPI } from "../services/api";

interface CollectionViewProps {
  collection: Collection;
  onBack: () => void;
  onEditItem: (item: Item | null) => void;
  initialTab?: string;
}

export function CollectionView({ collection, onBack, onEditItem, initialTab }: CollectionViewProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "items");
  const [templateHtml, setTemplateHtml] = useState<string>("");
  const [placeholderFields, setPlaceholderFields] = useState<Field[]>([]);
  const [loadingPlaceholders, setLoadingPlaceholders] = useState(false);
  const [refreshFieldsKey, setRefreshFieldsKey] = useState(0);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const codeEditorRef = useRef<CodeEditorRef>(null);

  // HTML tags list
  const htmlTags = [
    { value: "<h1></h1>", label: "h1 - Heading 1" },
    { value: "<h2></h2>", label: "h2 - Heading 2" },
    { value: "<h3></h3>", label: "h3 - Heading 3" },
    { value: "<h4></h4>", label: "h4 - Heading 4" },
    { value: "<h5></h5>", label: "h5 - Heading 5" },
    { value: "<h6></h6>", label: "h6 - Heading 6" },
    { value: "<p></p>", label: "p - Paragraph" },
    { value: "<div></div>", label: "div - Division" },
    { value: "<span></span>", label: "span - Inline" },
    { value: "<a href=\"\"></a>", label: "a - Link" },
    { value: "<img src=\"\" alt=\"\" />", label: "img - Image" },
    { value: "<ul></ul>", label: "ul - Unordered List" },
    { value: "<ol></ol>", label: "ol - Ordered List" },
    { value: "<li></li>", label: "li - List Item" },
    { value: "<strong></strong>", label: "strong - Bold" },
    { value: "<em></em>", label: "em - Italic" },
    { value: "<br />", label: "br - Line Break" },
    { value: "<hr />", label: "hr - Horizontal Rule" },
    { value: "<button></button>", label: "button - Button" },
    { value: "<input type=\"text\" />", label: "input - Input Field" },
    { value: "<textarea></textarea>", label: "textarea - Text Area" },
    { value: "<table></table>", label: "table - Table" },
    { value: "<tr></tr>", label: "tr - Table Row" },
    { value: "<td></td>", label: "td - Table Cell" },
    { value: "<section></section>", label: "section - Section" },
    { value: "<article></article>", label: "article - Article" },
    { value: "<header></header>", label: "header - Header" },
    { value: "<footer></footer>", label: "footer - Footer" },
    { value: "<nav></nav>", label: "nav - Navigation" },
  ];

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load saved template from API using getById
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoadingTemplate(true);
        console.log("Loading template for collection:", collection.id);
        
        // First, get all templates to find the template ID
        const res = await pageTemplatesAPI.getAll(collection.id);
        console.log("getAll response:", res);
        
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          // Get the first template (or most recent one) to get its ID
          const template = res.data.data[0];
          const templateIdStr = template.id.toString();
          console.log("Template ID found:", templateIdStr);
          setTemplateId(templateIdStr);
          
          // Now use getById to fetch complete template data
          console.log("Calling getById with ID:", templateIdStr);
          const templateRes = await pageTemplatesAPI.getById(templateIdStr);
          console.log("getById response:", templateRes);
          
          if (templateRes.data.success && templateRes.data.data) {
            const templateData = templateRes.data.data;
            console.log("Template data loaded:", templateData);
            setTemplateHtml(templateData.htmlContent || "");
            setCustomCss(templateData.customCss || "");
            setCustomJs(templateData.customJs || "");
          } else {
            console.log("getById failed, using getAll data");
            // Fallback to data from getAll if getById fails
            setTemplateHtml(template.htmlContent || "");
            setCustomCss(template.customCss || "");
            setCustomJs(template.customJs || "");
          }
        } else {
          console.log("No templates found for collection");
        }
      } catch (e: any) {
        console.error("Error loading template:", e);
        console.error("Error details:", e?.response?.data || e?.message);
        toast.error("Failed to load template: " + (e?.response?.data?.message || e?.message || "Unknown error"));
      } finally {
        setIsLoadingTemplate(false);
      }
    };
    loadTemplate();
  }, [collection.id, refreshFieldsKey]);

  // Function to load field names
  const loadFieldNames = useCallback(async () => {
    try {
      setLoadingPlaceholders(true);
      const res = await collectionFieldsAPI.getAllFieldName(collection.id);
      const apiFields = (res.data?.data || []) as any[];
      const mapped: Field[] = apiFields.map((af) => ({
        id: af.id,
        name: af.fieldLabel,
        type: 'text', // Default type since getAllFieldName only returns id and fieldLabel
        required: false,
        options: [],
      }));
      setPlaceholderFields(mapped);
    } catch (e) {
      // fallback to incoming collection fields
      setPlaceholderFields(collection.fields || []);
    } finally {
      setLoadingPlaceholders(false);
    }
  }, [collection.id, collection.fields]);

  // Fetch field names for placeholders (using getAllFieldName API)
  useEffect(() => {
    loadFieldNames();
  }, [loadFieldNames, refreshFieldsKey]);

  // Callback to refresh fields when they change in FieldsStructure
  const handleFieldsChange = () => {
    setRefreshFieldsKey(prev => prev + 1);
  };

  const handleSaveTemplate = async () => {
    try {
      setIsSavingTemplate(true);
      
      // Validate that template has content
      const trimmedHtml = templateHtml?.trim() || "";
      if (!trimmedHtml) {
        toast.error("Please add HTML content before saving the template.");
        setIsSavingTemplate(false);
        return;
      }
      
      if (templateId) {
        // Update existing template
        await pageTemplatesAPI.update(templateId, {
          htmlContent: trimmedHtml,
        });
        toast.success("Template updated successfully!");
      } else {
        // Create new template
        const res = await pageTemplatesAPI.create({
          collectionId: collection.id,
          htmlContent: trimmedHtml,     
        });
        if (res.data.success && res.data.data) {
          setTemplateId(res.data.data.id.toString());
          toast.success("Template created successfully!");
        }
      }
    } catch (e: any) {
      console.error("Error saving template:", e);
      toast.error(e?.response?.data?.message || "Failed to save template.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleResetTemplate = async () => {
    try {
      setIsSavingTemplate(true);
      
      // If template exists, delete it from database
      if (templateId) {
        await pageTemplatesAPI.delete(templateId);
        toast.success("Template deleted successfully!");
      }
      
      // Clear local state
      setTemplateHtml("");
      setTemplateId(null);
      
      // Also clear localStorage
      try {
        localStorage.removeItem(`collection-template-${collection.id}`);
      } catch {}
    } catch (e: any) {
      console.error("Error deleting template:", e);
      toast.error(e?.response?.data?.message || "Failed to delete template.");
      // Still clear local state even if API call fails
      setTemplateHtml("");
      setTemplateId(null);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleCopyPlaceholder = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Placeholder copied");
    } catch {}
  };

  const handleInsertHtmlTag = (tag: string) => {
    if (codeEditorRef.current) {
      codeEditorRef.current.insertText(tag);
      toast.success("HTML tag inserted");
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
              <h2 className="text-neutral-900">{collection.name}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-neutral-200 px-8 bg-white">
            <TabsList className="bg-transparent h-12 p-0 space-x-1">
              <TabsTrigger
                value="items"
                className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
              >
                Items
              </TabsTrigger>
              <TabsTrigger
                value="fields"
                className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
              >
                Fields & Structure
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
              >
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="template"
                className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
              >
                Display Page Template
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="items" className="h-full m-0">
              <CollectionItemsList collection={collection} onEditItem={onEditItem} />
            </TabsContent>

            <TabsContent value="fields" className="h-full m-0 p-8 overflow-auto bg-neutral-50">
              <FieldsStructure collection={collection} onFieldsChange={handleFieldsChange} />
            </TabsContent>

            <TabsContent value="settings" className="h-full m-0 p-8 overflow-auto bg-neutral-50">
              <CollectionSettings collection={collection} />
            </TabsContent>

            {/* Display Page Template Tab */}
            <TabsContent value="template" className="h-full m-0 p-8 overflow-auto bg-neutral-50">
              <div className="max-w-6xl mx-auto flex grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-neutral-900">HTML</h3>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleResetTemplate}
                        disabled={isSavingTemplate || isLoadingTemplate}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isSavingTemplate ? "Deleting..." : "Delete"}
                      </Button>
                      <Button 
                        className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500" 
                        onClick={handleSaveTemplate}
                        disabled={isSavingTemplate || isLoadingTemplate}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSavingTemplate ? "Saving..." : "Save Template"}
                      </Button>
                    </div>
                  </div>
                  {isLoadingTemplate ? (
                    <div className="flex items-center justify-center h-[500px]">
                      <p className="text-neutral-500">Loading template...</p>
                    </div>
                  ) : (
                    <CodeEditor ref={codeEditorRef} value={templateHtml} onChange={setTemplateHtml} language="html" height={500} />
                  )}
                  <p className="text-sm text-neutral-500">
                    Use placeholders from the right panel inside your HTML. They will be replaced by item values when rendering.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-neutral-900">Placeholders</h3>
                  <p className="text-sm text-neutral-500">Click to copy a placeholder.</p>
                  <div className="space-y-2">
                    {loadingPlaceholders ? (
                      <p className="text-sm text-neutral-500">Loading fields…</p>
                    ) : placeholderFields.length === 0 ? (
                      <div className="rounded border border-neutral-200 bg-white p-3 text-sm text-neutral-600">
                        No fields found. Add fields in the "Fields & Structure" tab.
                      </div>
                    ) : (
                      placeholderFields.map((f) => {
                        // Convert field name to lowercase for placeholder (e.g., "Title" -> "title")
                        const placeholderName = f.name.toLowerCase().replace(/\s+/g, '_');
                        return (
                          <div key={f.id} className="flex items-center justify-between rounded border border-neutral-200 bg-white px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-900">{f.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-neutral-100 px-1 py-0.5 text-neutral-700">{`{{${placeholderName}}}`}</code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => handleCopyPlaceholder(`{{${placeholderName}}}`)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="rounded border border-neutral-200 bg-white p-3">
                    <p className="text-xs text-neutral-500">
                      Example: to show Title field value, add
                      <code className="ml-1 rounded bg-neutral-100 px-1 py-0.5 text-neutral-700">{`{{title}}`}</code>
                      in the HTML.
                    </p>
                  </div>
                  
                  {/* HTML Tags Dropdown */}
                  <div className="space-y-2">
                    <h3 className="text-neutral-900">HTML Tags</h3>
                    <p className="text-sm text-neutral-500">Select a tag to insert into the editor.</p>
                    <Select onValueChange={handleInsertHtmlTag}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an HTML tag..." />
                      </SelectTrigger>
                      <SelectContent>
                        {htmlTags.map((tag) => (
                          <SelectItem key={tag.value} value={tag.value}>
                            {tag.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}