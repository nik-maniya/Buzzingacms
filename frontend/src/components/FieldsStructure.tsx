import { useState } from "react";
import { Plus, GripVertical, Trash2, Type, AlignLeft, Image, ChevronDown, ToggleLeft, Calendar, Tags, Edit } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Collection, Field } from "./DynamicPages";
import { FieldEditor } from "./FieldEditor";
import { FormField } from "./Forms";

interface FieldsStructureProps {
  collection: Collection;
}

// Convert Field (Collection) to FormField
const fieldToFormField = (field: Field): FormField => {
  return {
    id: field.id,
    label: field.name,
    type: field.type === "longtext" ? "longtext" : 
          field.type === "dropdown" ? "dropdown" :
          field.type === "boolean" ? "checkbox" :
          field.type === "image" ? "file" :
          field.type === "tags" ? "text" :
          "text",
    required: field.required,
    options: field.options,
  };
};

// Convert FormField to Field (Collection)
const formFieldToField = (formField: FormField): Field => {
  // Map FormField types back to Collection Field types
  let collectionType: Field["type"] = "text";
  if (formField.type === "longtext") collectionType = "longtext";
  else if (formField.type === "dropdown") collectionType = "dropdown";
  else if (formField.type === "checkbox") collectionType = "boolean";
  else if (formField.type === "file") collectionType = "image";
  else if (formField.type === "text" || formField.type === "email" || formField.type === "hidden") collectionType = "text";
  
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
  
};

const fieldTypeLabels = {
  text: "Text",
  longtext: "Long Text",
  image: "Image",
  dropdown: "Dropdown",
  boolean: "Boolean",
  date: "Date",
  tags: "Tags",
};

export function FieldsStructure({ collection }: FieldsStructureProps) {
  const [fields, setFields] = useState<Field[]>(collection.fields);
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const handleAddField = () => {
    setEditingField(null);
    setFieldEditorOpen(true);
  };

  const handleEditField = (field: Field) => {
    setEditingField(fieldToFormField(field));
    setFieldEditorOpen(true);
  };

  const handleSaveField = (formField: FormField) => {
    const collectionField = formFieldToField(formField);
    
    if (editingField) {
      // Update existing field
      setFields(fields.map((f) => (f.id === collectionField.id ? collectionField : f)));
    } else {
      // Add new field
      setFields([...fields, collectionField]);
    }
    setFieldEditorOpen(false);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
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

      {/* Fields List */}
      <div className="space-y-2">
        {fields.map((field) => {
          const Icon = fieldIcons[field.type];
          return (
            <Card key={field.id} className="border-neutral-200 hover:shadow-md transition-shadow">
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
                      onClick={() => handleDeleteField(field.id)}
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
    </div>
  );
}
