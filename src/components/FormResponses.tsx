import { useState } from "react";
import { ArrowLeft, Download, Trash2, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
import { ResponseDrawer } from "./ResponseDrawer";

interface FormResponsesProps {
  formId: string;
  onBack: () => void;
}

interface Response {
  id: string;
  formId: string;
  data: Record<string, string>;
  submittedAt: string;
}

export function FormResponses({ formId, onBack }: FormResponsesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sample responses data
  const [responses, setResponses] = useState<Response[]>([
    {
      id: "1",
      formId: "1",
      data: {
        Name: "John Doe",
        Email: "john@example.com",
        Message: "Hello there, I'd like to discuss a potential collaboration.",
      },
      submittedAt: "Oct 29, 2025 10:30 AM",
    },
    {
      id: "2",
      formId: "1",
      data: {
        Name: "Priya Shah",
        Email: "priya@company.in",
        Message: "Interested in your design services for our new project.",
      },
      submittedAt: "Oct 28, 2025 3:15 PM",
    },
    {
      id: "3",
      formId: "1",
      data: {
        Name: "Alex Johnson",
        Email: "alex.j@tech.com",
        Message: "Can we schedule a meeting to discuss pricing?",
      },
      submittedAt: "Oct 27, 2025 9:00 AM",
    },
  ]);

  const formName = "Contact Form"; // This would come from the form data

  const filteredResponses = responses.filter((response) => {
    const searchLower = searchQuery.toLowerCase();
    return Object.values(response.data).some((value) =>
      value.toLowerCase().includes(searchLower)
    );
  });

  const handleRowClick = (response: Response) => {
    setSelectedResponse(response);
    setDrawerOpen(true);
  };

  const handleDeleteResponse = (responseId: string) => {
    setResponses(responses.filter((r) => r.id !== responseId));
    setDrawerOpen(false);
    toast.success("Response deleted");
  };

  const handleDeleteAll = () => {
    setResponses([]);
    setDeleteAllDialogOpen(false);
    toast.success("All responses deleted");
  };

  const handleExportCSV = () => {
    toast.success("CSV export started");
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
        {/* Top Bar */}
        <div className="border-b border-neutral-200 bg-white">
          <div className="px-8 py-4 space-y-4">
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
                <div>
                  <p className="text-xs text-neutral-500">Forms / {formName}</p>
                  <h2 className="text-neutral-900">Responses</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setDeleteAllDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-neutral-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Responses Table */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {filteredResponses.length > 0 ? (
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm text-neutral-600">Name</th>
                      <th className="text-left px-6 py-3 text-sm text-neutral-600">Email</th>
                      <th className="text-left px-6 py-3 text-sm text-neutral-600">Message</th>
                      <th className="text-left px-6 py-3 text-sm text-neutral-600">
                        Submitted On
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.map((response) => (
                      <tr
                        key={response.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(response)}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm text-neutral-900">
                            {response.data.Name || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-neutral-900">
                            {response.data.Email || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-neutral-600 line-clamp-2">
                            {response.data.Message || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-neutral-600">{response.submittedAt}</span>
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
                <h3 className="text-neutral-900 mb-2">No responses yet</h3>
                <p className="text-neutral-500">
                  Responses will appear here when users submit the form
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Responses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all responses? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Response Detail Drawer */}
      {selectedResponse && (
        <ResponseDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          response={selectedResponse}
          formName={formName}
          onDelete={handleDeleteResponse}
        />
      )}
    </>
  );
}
