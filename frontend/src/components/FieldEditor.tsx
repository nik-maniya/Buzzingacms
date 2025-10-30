import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { FormField } from "./Forms";

interface FieldEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FormField | null;
  onSave: (field: FormField) => void;
}

export function FieldEditor({ open, onOpenChange, field, onSave }: FieldEditorProps) {
  const [fieldData, setFieldData] = useState<FormField>({
    id: "",
    label: "",
    type: "text",
    placeholder: "",
    required: false,
    defaultValue: "",
    options: [],
  });

  useEffect(() => {
    if (field) {
      setFieldData(field);
    } else {
      setFieldData({
        id: Date.now().toString(),
        label: "",
        type: "text",
        placeholder: "",
        required: false,
        defaultValue: "",
        options: [],
      });
    }
  }, [field, open]);

  const handleSave = () => {
    if (!fieldData.label) {
      return;
    }
    onSave(fieldData);
    onOpenChange(false);
  };

  const fieldTypeOptions = [
    { value: "text", label: "Text (single line)" },
    { value: "email", label: "Email" },
    { value: "longtext", label: "Long Text (textarea)" },
    { value: "dropdown", label: "Dropdown" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio" },
    { value: "file", label: "File Upload" },
    { value: "hidden", label: "Hidden" },
  ];

  const needsOptions = fieldData.type === "dropdown" || fieldData.type === "radio";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{field ? "Edit Field" : "Add Field"}</DialogTitle>
          <DialogDescription>
            {field ? "Update the field settings below." : "Configure your new form field."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="field-type">Field Type</Label>
              <Select
                value={fieldData.type}
                onValueChange={(value: FormField["type"]) =>
                  setFieldData({ ...fieldData, type: value })
                }
              >
                <SelectTrigger id="field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-label">Field Label</Label>
              <Input
                id="field-label"
                value={fieldData.label}
                onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
                placeholder="e.g., Full Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-placeholder">Placeholder Text (optional)</Label>
            <Input
              id="field-placeholder"
              value={fieldData.placeholder}
              onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
              placeholder="e.g., Enter your name"
            />
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <Label htmlFor="field-options">Options (one per line)</Label>
              <Textarea
                id="field-options"
                value={fieldData.options?.join("\n") || ""}
                onChange={(e) =>
                  setFieldData({
                    ...fieldData,
                    options: e.target.value.split("\n").filter((o) => o.trim()),
                  })
                }
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={5}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="field-default">Default Value (optional)</Label>
            <Input
              id="field-default"
              value={fieldData.defaultValue}
              onChange={(e) => setFieldData({ ...fieldData, defaultValue: e.target.value })}
              placeholder="Optional default value"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="field-required">Required Field</Label>
              <p className="text-xs text-neutral-600">Users must fill this field to submit</p>
            </div>
            <Switch
              id="field-required"
              checked={fieldData.required}
              onCheckedChange={(checked) => setFieldData({ ...fieldData, required: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
            disabled={!fieldData.label}
          >
            {field ? "Save Changes" : "Add Field"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
