import { useState } from "react";
import { ArrowLeft, Plus, GripVertical, Edit2, Trash2, Save } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { cn } from "./ui/utils";
import { FormField } from "./Forms";
import { FieldEditor } from "./FieldEditor";

interface FormBuilderProps {
  formId: string | null;
  onBack: () => void;
}

const ItemTypes = {
  FIELD: "field",
};

interface DraggableFieldRowProps {
  field: FormField;
  index: number;
  moveField: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (field: FormField) => void;
  onDelete: (index: number) => void;
}

function DraggableFieldRow({
  field,
  index,
  moveField,
  onEdit,
  onDelete,
}: DraggableFieldRowProps) {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.FIELD,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.FIELD,
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveField(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: "Text",
      email: "Email",
      longtext: "Long Text",
      dropdown: "Dropdown",
      checkbox: "Checkbox",
      radio: "Radio",
      file: "File Upload",
      hidden: "Hidden",
    };
    return labels[type] || type;
  };

  return (
    <div
      ref={(node) => dragPreview(drop(node))}
      className={cn(
        "bg-white border border-neutral-200 rounded-lg transition-all",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div ref={drag} className="cursor-move text-neutral-400 hover:text-neutral-600">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-900">{field.label}</span>
            <Badge variant="outline" className="text-xs">
              {getFieldTypeLabel(field.type)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {field.required && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Required</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900"
            onClick={() => onEdit(field)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-neutral-600 hover:text-red-600"
            onClick={() => onDelete(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FormBuilder({ formId, onBack }: FormBuilderProps) {
  const [formName, setFormName] = useState(formId === "new" ? "" : "Contact Form");
  const [formSlug, setFormSlug] = useState(formId === "new" ? "" : "contact-form");
  const [formDescription, setFormDescription] = useState("");
  const [storeResponses, setStoreResponses] = useState(true);
  const [fields, setFields] = useState<FormField[]>(
    formId === "new"
      ? []
      : [
          { id: "1", label: "Name", type: "text", required: true, placeholder: "Your name" },
          {
            id: "2",
            label: "Email",
            type: "email",
            required: true,
            placeholder: "your@email.com",
          },
          {
            id: "3",
            label: "Message",
            type: "longtext",
            required: false,
            placeholder: "Your message",
          },
        ]
  );

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailSendTo, setEmailSendTo] = useState("admin@buzzinga.com");
  const [emailSubject, setEmailSubject] = useState("New Form Submission");
  const [emailBody, setEmailBody] = useState(
    "Hi, you received a new {{form_name}} submission.\n\nName: {{Name}}\nEmail: {{Email}}\nMessage: {{Message}}"
  );

  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const handleAddField = () => {
    setEditingField(null);
    setFieldEditorOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setFieldEditorOpen(true);
  };

  const handleSaveField = (field: FormField) => {
    if (editingField) {
      // Update existing field
      setFields(fields.map((f) => (f.id === field.id ? field : f)));
    } else {
      // Add new field
      setFields([...fields, field]);
    }
  };

  const handleDeleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (dragIndex: number, hoverIndex: number) => {
    const newFields = [...fields];
    const draggedField = newFields[dragIndex];
    newFields.splice(dragIndex, 1);
    newFields.splice(hoverIndex, 0, draggedField);
    setFields(newFields);
  };

  const handleSave = () => {
    if (!formName) {
      toast.error("Please enter a form name");
      return;
    }

    if (fields.length === 0) {
      toast.error("Please add at least one field");
      return;
    }

    if (emailEnabled && (!emailSendTo || !emailSubject)) {
      toast.error("Please complete email notification settings");
      return;
    }

    toast.success("Form saved successfully");
    onBack();
  };

  const handlePublish = () => {
    handleSave();
  };

  // Auto-generate slug from form name
  const handleFormNameChange = (name: string) => {
    setFormName(name);
    if (formId === "new") {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormSlug(slug);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
        {/* Top Bar */}
        <div className="border-b border-neutral-200 bg-white">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
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
                <h2 className="text-neutral-900">
                  {formId === "new" ? "Create New Form" : `Edit Form — ${formName}`}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleSave}>
                  Save Draft
                </Button>
                <Button
                  className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
                  onClick={handlePublish}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Publish Form
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8 space-y-6">
            {/* Form Details */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
              <h3 className="text-neutral-900">Form Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="form-name">Form Name</Label>
                  <Input
                    id="form-name"
                    value={formName}
                    onChange={(e) => handleFormNameChange(e.target.value)}
                    placeholder="e.g., Contact Form"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-slug">Form Slug</Label>
                  <Input
                    id="form-slug"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="contact-form"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-description">Description (optional)</Label>
                <Textarea
                  id="form-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this form"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="store-responses">Store responses in CMS</Label>
                  <p className="text-xs text-neutral-600">
                    Save form submissions for viewing and export
                  </p>
                </div>
                <Switch
                  id="store-responses"
                  checked={storeResponses}
                  onCheckedChange={setStoreResponses}
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-neutral-900">Form Fields</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                  className="border-neutral-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-neutral-300 p-12 text-center">
                  <p className="text-neutral-500 mb-4">No fields added yet</p>
                  <Button
                    variant="outline"
                    onClick={handleAddField}
                    className="border-neutral-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add your first field
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <DraggableFieldRow
                      key={field.id}
                      field={field}
                      index={index}
                      moveField={moveField}
                      onEdit={handleEditField}
                      onDelete={handleDeleteField}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Email Notification */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-neutral-900">Email Notification (Optional)</h3>
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>

              {emailEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="email-to">Send to</Label>
                    <Input
                      id="email-to"
                      type="email"
                      value={emailSendTo}
                      onChange={(e) => setEmailSendTo(e.target.value)}
                      placeholder="admin@buzzinga.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="New Form Submission"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-body">Body Template</Label>
                    <Textarea
                      id="email-body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Email body with field placeholders"
                      rows={8}
                    />
                    <p className="text-xs text-neutral-600">
                      Use <code className="px-1 py-0.5 bg-neutral-100 rounded">{"{{field_label}}"}</code> to include
                      submitted data in the email.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FieldEditor
        open={fieldEditorOpen}
        onOpenChange={setFieldEditorOpen}
        field={editingField}
        onSave={handleSaveField}
      />
    </DndProvider>
  );
}
