import { useState } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
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
import { cn } from "./ui/utils";

interface Redirect {
  id: string;
  fromPath: string;
  toPath: string;
  type: "301" | "302";
  lastUpdated: string;
}

export function Redirects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [redirectToDelete, setRedirectToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [redirects, setRedirects] = useState<Redirect[]>([
    {
      id: "1",
      fromPath: "/old-page",
      toPath: "/new-page",
      type: "301",
      lastUpdated: "Oct 28, 2025",
    },
    {
      id: "2",
      fromPath: "/blog/ai",
      toPath: "/articles/ai",
      type: "302",
      lastUpdated: "Oct 22, 2025",
    },
    {
      id: "3",
      fromPath: "/services/consulting",
      toPath: "/consulting",
      type: "301",
      lastUpdated: "Oct 20, 2025",
    },
  ]);

  const filteredRedirects = redirects.filter(
    (redirect) =>
      redirect.fromPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      redirect.toPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addRedirect = () => {
    const newRedirect: Redirect = {
      id: Date.now().toString(),
      fromPath: "",
      toPath: "",
      type: "301",
      lastUpdated: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    setRedirects([newRedirect, ...redirects]);
    setEditingId(newRedirect.id);
  };

  const updateRedirect = (id: string, updates: Partial<Redirect>) => {
    setRedirects(
      redirects.map((redirect) =>
        redirect.id === id ? { ...redirect, ...updates } : redirect
      )
    );
  };

  const deleteRedirect = (id: string) => {
    setRedirects(redirects.filter((redirect) => redirect.id !== id));
    toast.success("Redirect deleted");
    setDeleteDialogOpen(false);
    setRedirectToDelete(null);
  };

  const validateRedirect = (redirect: Redirect): string | null => {
    if (!redirect.fromPath || !redirect.toPath) {
      return "Both paths are required";
    }
    if (!redirect.fromPath.startsWith("/")) {
      return "From path must start with /";
    }
    if (redirect.fromPath === redirect.toPath) {
      return "Cannot redirect to the same path";
    }
    return null;
  };

  const handleSaveRedirect = (id: string) => {
    const redirect = redirects.find((r) => r.id === id);
    if (!redirect) return;

    const error = validateRedirect(redirect);
    if (error) {
      toast.error(error);
      return;
    }

    setEditingId(null);
    toast.success("Redirect saved");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
      {/* Top Bar */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="px-8 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-neutral-900">Redirects</h2>
            <Button
              className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
              onClick={addRedirect}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Redirect
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search redirects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-neutral-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Redirects Table */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm text-neutral-600">From Path</th>
                  <th className="text-left px-6 py-3 text-sm text-neutral-600">To Path</th>
                  <th className="text-left px-6 py-3 text-sm text-neutral-600">Type</th>
                  <th className="text-left px-6 py-3 text-sm text-neutral-600">Last Updated</th>
                  <th className="text-right px-6 py-3 text-sm text-neutral-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRedirects.map((redirect) => (
                  <tr
                    key={redirect.id}
                    className={cn(
                      "border-b border-neutral-100 transition-colors",
                      editingId === redirect.id ? "bg-yellow-50" : "hover:bg-neutral-50"
                    )}
                  >
                    <td className="px-6 py-3">
                      {editingId === redirect.id ? (
                        <Input
                          value={redirect.fromPath}
                          onChange={(e) =>
                            updateRedirect(redirect.id, { fromPath: e.target.value })
                          }
                          placeholder="/old-path"
                          className="h-9 border-neutral-200"
                        />
                      ) : (
                        <span className="text-sm text-neutral-900 font-mono">
                          {redirect.fromPath}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {editingId === redirect.id ? (
                        <Input
                          value={redirect.toPath}
                          onChange={(e) =>
                            updateRedirect(redirect.id, { toPath: e.target.value })
                          }
                          placeholder="/new-path"
                          className="h-9 border-neutral-200"
                        />
                      ) : (
                        <span className="text-sm text-neutral-900 font-mono">
                          {redirect.toPath}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {editingId === redirect.id ? (
                        <Select
                          value={redirect.type}
                          onValueChange={(value: "301" | "302") =>
                            updateRedirect(redirect.id, { type: value })
                          }
                        >
                          <SelectTrigger className="w-28 h-9 border-neutral-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="301">301</SelectItem>
                            <SelectItem value="302">302</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-1 rounded text-xs",
                            redirect.type === "301"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          )}
                        >
                          {redirect.type}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-neutral-600">{redirect.lastUpdated}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === redirect.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-neutral-600 hover:text-neutral-900"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 px-3 bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
                              onClick={() => handleSaveRedirect(redirect.id)}
                            >
                              Save
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900"
                              onClick={() => setEditingId(redirect.id)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-neutral-600 hover:text-red-600"
                              onClick={() => {
                                setRedirectToDelete(redirect.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRedirects.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-neutral-500 mb-4">No redirects found</p>
                <Button
                  variant="outline"
                  onClick={addRedirect}
                  className="border-neutral-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add your first redirect
                </Button>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>301 Redirects</strong> are permanent and help preserve SEO rankings.{" "}
              <strong>302 Redirects</strong> are temporary and won't transfer SEO value.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Redirect</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this redirect? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => redirectToDelete && deleteRedirect(redirectToDelete)}
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
