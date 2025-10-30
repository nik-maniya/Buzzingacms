import { useState } from "react";
import { Plus, GripVertical, Trash2, Type, AlignLeft, Image, ChevronDown, ToggleLeft, Calendar, Tags } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Collection, Field } from "./DynamicPages";

interface FieldsStructureProps {
  collection: Collection;
}

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
  const [fields] = useState<Field[]>(collection.fields);

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
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-neutral-600 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Field
      </Button>
    </div>
  );
}
