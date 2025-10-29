import { useState } from "react";
import { Plus, Search, Edit2, Eye, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Form } from "./Forms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";

interface FormsListProps {
  onNewForm: () => void;
  onEditForm: (formId: string) => void;
  onViewResponses: (formId: string) => void;
}

export function FormsList({ onNewForm, onEditForm, onViewResponses }: FormsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  // Sample forms data
  const [forms, setForms] = useState<Form[]>([
    {
      id: "1",
      name: "Contact Form",
      slug: "contact-form",
      description: "General contact form for website visitors",
      fields: [],
      emailNotification: {
        enabled: true,
        sendTo: "admin@buzzinga.com",
        subject: "New Contact Form Submission",
        bodyTemplate: "You received a new submission from {{Name}}",
      },
      storeResponses: true,
      responseCount: 23,
      lastSubmission: "Oct 29, 2025",
      createdAt: "Oct 15, 2025",
      status: "published",
    },
    {
      id: "2",
      name: "Careers",
      slug: "careers",
      description: "Job application form",
      fields: [],
      emailNotification: {
        enabled: true,
        sendTo: "hr@buzzinga.com",
        subject: "New Career Application",
        bodyTemplate: "New application from {{Name}}",
      },
      storeResponses: true,
      responseCount: 8,
      lastSubmission: "Oct 27, 2025",
      createdAt: "Oct 10, 2025",
      status: "published",
    },
    {
      id: "3",
      name: "Newsletter",
      slug: "newsletter",
      description: "Newsletter signup form",
      fields: [],
      emailNotification: {
        enabled: false,
        sendTo: "",
        subject: "",
        bodyTemplate: "",
      },
      storeResponses: true,
      responseCount: 140,
      lastSubmission: "Oct 28, 2025",
      createdAt: "Oct 5, 2025",
      status: "published",
    },
  ]);

  const filteredForms = forms.filter((form) =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteForm = (formId: string) => {
    setForms(forms.filter((form) => form.id !== formId));
    toast.success("Form deleted successfully");
    setDeleteDialogOpen(false);
    setFormToDelete(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
      {/* Top Bar */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="px-8 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-neutral-900">Forms</h2>
            <Button
              className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
              onClick={onNewForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Form
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-neutral-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Forms Table */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {filteredForms.length > 0 ? (
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm text-neutral-600">Form Name</th>
                    <th className="text-left px-6 py-3 text-sm text-neutral-600">
                      Total Responses
                    </th>
                    <th className="text-left px-6 py-3 text-sm text-neutral-600">
                      Last Submission
                    </th>
                    <th className="text-right px-6 py-3 text-sm text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.map((form) => (
                    <tr
                      key={form.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-sm text-neutral-900">{form.name}</span>
                          {form.description && (
                            <p className="text-xs text-neutral-500 mt-1">{form.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-900">{form.responseCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-600">{form.lastSubmission}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-neutral-600 hover:text-neutral-900"
                            onClick={() => onEditForm(form.id)}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-neutral-600 hover:text-neutral-900"
                            onClick={() => onViewResponses(form.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Responses
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setFormToDelete(form.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Form
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg border-2 border-dashed border-neutral-300 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 rounded-lg bg-neutral-200" />
              </div>
              <h3 className="text-neutral-900 mb-2">No forms yet</h3>
              <p className="text-neutral-500 mb-4">Create your first form to start collecting responses</p>
              <Button
                onClick={onNewForm}
                className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first form
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this form? All responses will also be deleted. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => formToDelete && handleDeleteForm(formToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
