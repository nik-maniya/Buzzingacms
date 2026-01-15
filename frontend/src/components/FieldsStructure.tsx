import { useState, useEffect } from "react";
import type React from "react";
import { Plus, GripVertical, Trash2, Type, AlignLeft, Image, ChevronDown, ToggleLeft, Calendar, Tags, Edit, Circle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Collection, Field } from "./DynamicPages";
import { FieldEditor } from "./FieldEditor";
import { FormField } from "./Forms";
import { collectionFieldsAPI } from "../services/api";
import { toast } from "sonner";

interface FieldsStructureProps {
  collection: Collection;
  onFieldsChange?: () => void;
}

// Convert Field (Collection) to FormField with placeholder and defaultValue
const fieldToFormField = (field: Field, apiFieldData?: any): FormField => {
  // Get options from options field, fallback to defaultValue for backward compatibility
  let options: string[] = field.options || [];
  let defaultValue = "";
  
  // First try to get options from the options field
  if (apiFieldData?.options) {
    if (Array.isArray(apiFieldData.options)) {
      options = apiFieldData.options;
    } else if (typeof apiFieldData.options === 'string') {
      try {
        const parsed = JSON.parse(apiFieldData.options);
        if (Array.isArray(parsed)) {
          options = parsed;
        }
      } catch (e) {
        // Not valid JSON
      }
    }
  }
  
  // If no options found, check defaultValue for backward compatibility
  if (options.length === 0 && apiFieldData?.defaultValue) {
    try {
      const parsed = JSON.parse(apiFieldData.defaultValue);
      if (Array.isArray(parsed)) {
        options = parsed;
      } else {
        defaultValue = apiFieldData.defaultValue;
      }
    } catch (e) {
      defaultValue = apiFieldData.defaultValue;
    }
  } else if (apiFieldData?.defaultValue) {
    defaultValue = apiFieldData.defaultValue;
  }

  // Map collection field types to FormField types
  let formFieldType: FormField["type"] = "text";
  if (field.type === "longtext") formFieldType = "longtext";
  else if (field.type === "dropdown") formFieldType = "dropdown";
  else if (field.type === "radio") formFieldType = "radio";
  else if (field.type === "boolean") formFieldType = "checkbox";
  else if (field.type === "image") formFieldType = "file";
  else if (field.type === "date") formFieldType = "text"; // Date can use text input
  else if (field.type === "tags") formFieldType = "text";
  else formFieldType = "text";

  return {
    id: field.id,
    label: field.name,
    type: formFieldType,
    required: field.required,
    options: options,
    placeholder: apiFieldData?.placeholder || "",
    defaultValue: defaultValue,
  };
};

// Convert FormField to Field (Collection)
const formFieldToField = (formField: FormField, preserveOriginalType?: string): Field => {
  // Map FormField types back to Collection Field types
  // If preserveOriginalType is provided (when editing), use it for date/tags
  let collectionType: Field["type"] = "text";
  if (preserveOriginalType && (preserveOriginalType === "date" || preserveOriginalType === "tags")) {
    collectionType = preserveOriginalType as Field["type"];
  } else if (formField.type === "longtext") collectionType = "longtext";
  else if (formField.type === "dropdown") collectionType = "dropdown";
  else if (formField.type === "radio") collectionType = "radio";
  else if (formField.type === "checkbox") collectionType = "boolean";
  else if (formField.type === "file") collectionType = "image";
  else collectionType = "text";
  
  return {
    id: formField.id,
    name: formField.label,
    type: collectionType,
    required: formField.required,
    options: formField.options,
  };
};

const fieldIcons = {
  text: Type,
  longtext: AlignLeft,
  image: Image,
  dropdown: ChevronDown,
  boolean: ToggleLeft,
  date: Calendar,
  tags: Tags,
  radio: Circle,
};

const fieldTypeLabels = {
  text: "Text",
  longtext: "Long Text",
  image: "Image",
  dropdown: "Dropdown",
  boolean: "Boolean",
  date: "Date",
  tags: "Tags",
  radio: "Radio",
};

export function FieldsStructure({ collection, onFieldsChange }: FieldsStructureProps) {
  const [fields, setFields] = useState<Field[]>(collection.fields);
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);

  // Store full API field data for placeholder/defaultValue
  const [fieldDataMap, setFieldDataMap] = useState<Map<string, any>>(new Map());

  // Fetch fields from API when collection changes
  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        const response = await collectionFieldsAPI.getAll(collection.id);
        if (response.data.success) {
          const apiFields = (response.data.data || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
          const dataMap = new Map<string, any>();
          const transformedFields = apiFields.map((apiField: any) => {
            // Store full API field data
            dataMap.set(apiField.id, apiField);

            // Get options from options field, fallback to defaultValue for backward compatibility
            let options: string[] = [];
            let defaultValue = "";
            
            // First try to get options from the options field
            if (apiField.options) {
              if (Array.isArray(apiField.options)) {
                options = apiField.options;
              } else if (typeof apiField.options === 'string') {
                try {
                  const parsed = JSON.parse(apiField.options);
                  if (Array.isArray(parsed)) {
                    options = parsed;
                  }
                } catch (e) {
                  // Not valid JSON
                }
              }
            }
            
            // If no options found, check defaultValue for backward compatibility
            if (options.length === 0 && apiField.defaultValue) {
              try {
                const parsed = JSON.parse(apiField.defaultValue);
                if (Array.isArray(parsed)) {
                  options = parsed;
                } else {
                  defaultValue = apiField.defaultValue;
                }
              } catch (e) {
                // Not JSON, treat as plain string
                defaultValue = apiField.defaultValue;
              }
            } else if (apiField.defaultValue) {
              defaultValue = apiField.defaultValue;
            }

            return {
              id: apiField.id,
              name: apiField.fieldLabel,
              type: apiField.fieldType as Field["type"],
              required: apiField.required || false,
              options: options,
            };
          });
          setFieldDataMap(dataMap);
          setFields(transformedFields);
        }
      } catch (error) {
        console.error("Error fetching fields:", error);
        // Fallback to collection.fields if API fails
        setFields(collection.fields);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [collection.id]);

  const handleAddField = () => {
    setEditingField(null);
    setFieldEditorOpen(true);
  };

  const handleEditField = (field: Field) => {
    const apiFieldData = fieldDataMap.get(field.id);
    setEditingField(fieldToFormField(field, apiFieldData));
    setFieldEditorOpen(true);
  };

  const handleSaveField = async (formField: FormField) => {
    try {
      setIsSaving(true);

      // Prepare data for API (backend format)
      const options = formField.options || [];
      const needsOptions = formField.type === "dropdown" || formField.type === "radio" || formField.type === "checkbox";

      if (editingField && editingField.id) {
        // Update existing field - preserve existing order and type
        const existingFieldData = fieldDataMap.get(editingField.id);
        const originalType = existingFieldData?.fieldType || "text";
        
        // Get the collection field, preserving original type if it's date or tags
        const collectionField = formFieldToField(formField, originalType);
        
        // For dropdown, radio, and checkbox, send options separately
        // For other fields, use defaultValue
        const apiData: any = {
          collectionId: collection.id,
          fieldType: collectionField.type,
          fieldLabel: collectionField.name,
          placeholder: formField.placeholder || null,
          required: collectionField.required || false,
          order: existingFieldData?.order ?? fields.length, // Preserve existing order
        };

        if (needsOptions) {
          // Send options for dropdown, radio, checkbox
          apiData.options = options.length > 0 ? options : null;
          apiData.defaultValue = formField.defaultValue || null;
        } else {
          // For other field types, use defaultValue
          apiData.defaultValue = formField.defaultValue || null;
          apiData.options = null;
        }
        const response = await collectionFieldsAPI.update(editingField.id, apiData);
        if (response.data.success) {
          const updatedField = response.data.data;
          // Get options from options field, fallback to defaultValue for backward compatibility
          let options: string[] = [];
          if (updatedField.options) {
            if (Array.isArray(updatedField.options)) {
              options = updatedField.options;
            } else if (typeof updatedField.options === 'string') {
              try {
                const parsed = JSON.parse(updatedField.options);
                if (Array.isArray(parsed)) {
                  options = parsed;
                }
              } catch (e) {
                // Not valid JSON
              }
            }
          } else if (updatedField.defaultValue) {
            // Backward compatibility: check defaultValue
            try {
              const parsed = JSON.parse(updatedField.defaultValue);
              if (Array.isArray(parsed)) {
                options = parsed;
              }
            } catch (e) {
              // Not JSON
            }
          }

          const transformedField: Field = {
            id: updatedField.id,
            name: updatedField.fieldLabel,
            type: updatedField.fieldType as Field["type"],
            required: updatedField.required || false,
            options: options,
          };
          // Update field data map
          setFieldDataMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(updatedField.id, updatedField);
            return newMap;
          });
          setFields(fields.map((f) => (f.id === transformedField.id ? transformedField : f)));
        }
      } else {
        // Create new field
        const collectionField = formFieldToField(formField);
        const needsOptions = formField.type === "dropdown" || formField.type === "radio" || formField.type === "checkbox";
        
        const apiData: any = {
          collectionId: collection.id,
          fieldType: collectionField.type,
          fieldLabel: collectionField.name,
          placeholder: formField.placeholder || null,
          required: collectionField.required || false,
          order: fields.length, // Set order based on current fields count
        };

        if (needsOptions) {
          // Send options for dropdown, radio, checkbox
          apiData.options = options.length > 0 ? options : null;
          apiData.defaultValue = formField.defaultValue || null;
        } else {
          // For other field types, use defaultValue
          apiData.defaultValue = formField.defaultValue || null;
          apiData.options = null;
        }

        const response = await collectionFieldsAPI.create(apiData);
        if (response.data.success) {
          const newField = response.data.data;
          // Get options from options field, fallback to defaultValue for backward compatibility
          let options: string[] = [];
          if (newField.options) {
            if (Array.isArray(newField.options)) {
              options = newField.options;
            } else if (typeof newField.options === 'string') {
              try {
                const parsed = JSON.parse(newField.options);
                if (Array.isArray(parsed)) {
                  options = parsed;
                }
              } catch (e) {
                // Not valid JSON
              }
            }
          } else if (newField.defaultValue) {
            // Backward compatibility: check defaultValue
            try {
              const parsed = JSON.parse(newField.defaultValue);
              if (Array.isArray(parsed)) {
                options = parsed;
              }
            } catch (e) {
              // Not JSON
            }
          }

          const transformedField: Field = {
            id: newField.id,
            name: newField.fieldLabel,
            type: newField.fieldType as Field["type"],
            required: newField.required || false,
            options: options,
          };
          // Add to field data map
          setFieldDataMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(newField.id, newField);
            return newMap;
          });
          setFields([...fields, transformedField]);
        }
      }
      setFieldEditorOpen(false);
      toast.success(editingField ? "Field updated successfully!" : "Field created successfully!");
      // Notify parent component to refresh field list
      if (onFieldsChange) {
        onFieldsChange();
      }
    } catch (error: any) {
      console.error("Error saving field:", error);
      toast.error(error.response?.data?.message || "Failed to save field");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteField = (field: Field) => {
    setFieldToDelete(field);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteField = async () => {
    if (!fieldToDelete) return;

    try {
      setIsSaving(true);
      const response = await collectionFieldsAPI.delete(fieldToDelete.id);
      if (response.data.success) {
        setFields(fields.filter((f) => f.id !== fieldToDelete.id));
        // Remove from field data map
        setFieldDataMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fieldToDelete.id);
          return newMap;
        });
        toast.success("Field deleted successfully!");
        setIsDeleteDialogOpen(false);
        setFieldToDelete(null);
        // Notify parent component to refresh field list
        if (onFieldsChange) {
          onFieldsChange();
        }
      }
    } catch (error: any) {
      console.error("Error deleting field:", error);
      toast.error(error.response?.data?.message || "Failed to delete field");
    } finally {
      setIsSaving(false);
    }
  };

  // Drag & Drop Handlers
  const onDragStart = (id: string) => {
    setDraggingId(id);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, overId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;

    const currentIndex = fields.findIndex((f) => f.id === draggingId);
    const overIndex = fields.findIndex((f) => f.id === overId);
    if (currentIndex === -1 || overIndex === -1) return;

    const updated = [...fields];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(overIndex, 0, moved);
    setFields(updated);
  };

  const onDragEnd = async () => {
    if (!draggingId) return;
    setDraggingId(null);
    // Persist order to backend
    try {
      setIsSaving(true);
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const apiData = {
          collectionId: collection.id,
          order: i,
        } as any;
        await collectionFieldsAPI.update(f.id, apiData);
        // Update map orders
        setFieldDataMap((prev) => {
          const next = new Map(prev);
          const existing = next.get(f.id) as any;
          if (existing) next.set(f.id, { ...(existing as any), order: i });
          return next;
        });
      }
    } catch (error) {
      console.error("Error saving fields order:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-neutral-900">Collection Fields</h3>
          <p className="text-sm text-neutral-600 mt-1">
            Define the structure and fields for your {collection.name.toLowerCase()} items
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-neutral-500">Loading fields...</p>
        </div>
      )}

      {isSaving && (
        <div className="flex items-center justify-center py-2">
          <p className="text-sm text-neutral-500">Saving...</p>
        </div>
      )}

      {/* Fields List */}
      <div className="space-y-2">
        {fields.map((field) => {
          const Icon = fieldIcons[field.type] || Type; // Fallback to Type icon if not found
          return (
            <Card
              key={field.id}
              className="border-neutral-200 hover:shadow-md transition-shadow"
              draggable
              onDragStart={() => onDragStart(field.id)}
              onDragOver={(e) => onDragOver(e, field.id)}
              onDragEnd={onDragEnd}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="cursor-grab text-neutral-400 hover:text-neutral-600">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-900">{field.name}</span>
                      {field.required && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {fieldTypeLabels[field.type]}
                      {field.options && field.options.length > 0 && (
                        <span className="ml-2">({field.options.length} options)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900"
                      onClick={() => handleEditField(field)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-neutral-600 hover:text-red-600"
                    onClick={() => handleDeleteField(field)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Field Button */}
      <Button
        variant="outline"
        className="w-full border-dashed border-2 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
        onClick={handleAddField}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Field
      </Button>

      {/* Field Editor Dialog - Using the same FieldEditor from Forms */}
      <FieldEditor
        open={fieldEditorOpen}
        onOpenChange={setFieldEditorOpen}
        field={editingField}
        onSave={handleSaveField}
      />

      {/* Delete Field Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[425px] w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Delete Field</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the field
              {" "}
              <span className="font-medium text-neutral-900">
                {fieldToDelete?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDeleteField}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
