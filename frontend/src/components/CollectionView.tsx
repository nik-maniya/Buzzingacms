import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Copy, Save, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Collection, Item, Field } from "./DynamicPages";
import { CollectionItemsList } from "./CollectionItemsList";
import { FieldsStructure } from "./FieldsStructure";
import { CollectionSettings } from "./CollectionSettings";
import { CodeEditor } from "./CodeEditor";
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

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load saved template from API
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoadingTemplate(true);
        const res = await pageTemplatesAPI.getAll(collection.id);
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          // Get the first template (or most recent one)
          const template = res.data.data[0];
          setTemplateId(template.id.toString());
          setTemplateHtml(template.htmlContent || "");
        } else {
          // Fallback to localStorage if no API template exists
          try {
            const saved = localStorage.getItem(`collection-template-${collection.id}`);
            if (saved) setTemplateHtml(saved);
          } catch {}
        }
      } catch (e) {
        // Fallback to localStorage on error
        try {
          const saved = localStorage.getItem(`collection-template-${collection.id}`);
          if (saved) setTemplateHtml(saved);
        } catch {}
      } finally {
        setIsLoadingTemplate(false);
      }
    };
    loadTemplate();
  }, [collection.id]);

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
      
      if (templateId) {
        // Update existing template
        await pageTemplatesAPI.update(templateId, {
          htmlContent: templateHtml || "",
        });
        toast.success("Template updated successfully!");
      } else {
        // Create new template
        const res = await pageTemplatesAPI.create({
          collectionId: collection.id,
          htmlContent: templateHtml || "",
        });
        if (res.data.success && res.data.data) {
          setTemplateId(res.data.data.id.toString());
          toast.success("Template created successfully!");
        }
      }
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem(`collection-template-${collection.id}`, templateHtml || "");
      } catch {}
    } catch (e: any) {
      console.error("Error saving template:", e);
      toast.error(e?.response?.data?.message || "Failed to save template.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleResetTemplate = () => {
    setTemplateHtml("");
    setTemplateId(null);
    toast.message("Template cleared.");
  };

  const handleCopyPlaceholder = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Placeholder copied");
    } catch {}
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
                      <Button variant="outline" onClick={handleResetTemplate}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
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
                    <CodeEditor value={templateHtml} onChange={setTemplateHtml} language="html" height={500} />
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
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}