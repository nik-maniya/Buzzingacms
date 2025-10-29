import { useState } from "react";
import { FormsList } from "./FormsList";
import { FormBuilder } from "./FormBuilder";
import { FormResponses } from "./FormResponses";

export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "longtext" | "dropdown" | "checkbox" | "radio" | "file" | "hidden";
  placeholder?: string;
  required: boolean;
  defaultValue?: string;
  options?: string[]; // for dropdown, radio
}

export interface EmailNotification {
  enabled: boolean;
  sendTo: string;
  subject: string;
  bodyTemplate: string;
}

export interface Form {
  id: string;
  name: string;
  slug: string;
  description?: string;
  fields: FormField[];
  emailNotification: EmailNotification;
  storeResponses: boolean;
  responseCount: number;
  lastSubmission?: string;
  createdAt: string;
  status: "draft" | "published";
}

export function Forms() {
  const [currentView, setCurrentView] = useState<"list" | "builder" | "responses">("list");
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [viewingResponsesFormId, setViewingResponsesFormId] = useState<string | null>(null);

  const handleNewForm = () => {
    setEditingFormId("new");
    setCurrentView("builder");
  };

  const handleEditForm = (formId: string) => {
    setEditingFormId(formId);
    setCurrentView("builder");
  };

  const handleViewResponses = (formId: string) => {
    setViewingResponsesFormId(formId);
    setCurrentView("responses");
  };

  const handleBackToList = () => {
    setEditingFormId(null);
    setViewingResponsesFormId(null);
    setCurrentView("list");
  };

  return (
    <>
      {currentView === "list" && (
        <FormsList
          onNewForm={handleNewForm}
          onEditForm={handleEditForm}
          onViewResponses={handleViewResponses}
        />
      )}

      {currentView === "builder" && (
        <FormBuilder formId={editingFormId} onBack={handleBackToList} />
      )}

      {currentView === "responses" && viewingResponsesFormId && (
        <FormResponses formId={viewingResponsesFormId} onBack={handleBackToList} />
      )}
    </>
  );
}
