import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Copy, Trash2, Lock, Rocket, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Collection, Item } from "./DynamicPages";
import { collectionItemsAPI, pageTemplatesAPI } from "../services/api";
import { toast } from "sonner";

interface CollectionItemsListProps {
  collection: Collection;
  onEditItem: (item: Item | null) => void;
}

export function CollectionItemsList({ collection, onEditItem }: CollectionItemsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handlePreview = async (itemId: string | number) => {
    try {
      setIsPreviewLoading(true);
      setIsPreviewOpen(true);
      setPreviewHtml("");
      const res = await pageTemplatesAPI.renderItem(collection.id, itemId);
      const html = res?.data?.data?.htmlContent || "";
      setPreviewHtml(html);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load preview");
      setPreviewHtml("");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Transform API item to frontend Item format
  const transformItem = (apiItem: any): Item => {
    const data = apiItem.data || {};
    const updatedDate = new Date(apiItem.updatedAt);
    const lastUpdated = updatedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Normalize status to uppercase
    const apiStatus = (apiItem.status || "DRAFT").toUpperCase();
    const normalizedStatus = 
      apiStatus === "DRAFT" || apiStatus === "PUBLISHED" || apiStatus === "ARCHIVED"
        ? (apiStatus as "DRAFT" | "PUBLISHED" | "ARCHIVED")
        : "DRAFT";

    return {
      id: apiItem.id,
      title: data.title || "Untitled",
      slug: data.slug || "",
      status: normalizedStatus,
      lastUpdated,
      fields: data,
    };
  };

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await collectionItemsAPI.getAll(collection.id);
        if (response.data.success) {
          const apiItems = response.data.data || [];
          const transformedItems = apiItems.map(transformItem);
          setItems(transformedItems);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [collection.id]);

  const openDeleteDialog = (item: Item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const response = await collectionItemsAPI.delete(itemToDelete.id);
      if (response.data.success) {
        setItems(items.filter((item) => item.id !== itemToDelete.id));
        toast.success("Item deleted successfully!");
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
      }
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error(error.response?.data?.message || "Failed to delete item");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col bg-neutral-50 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-neutral-200 bg-white px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder={`Search ${collection.name.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-neutral-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                {/*   */}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] border-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
            onClick={() => onEditItem(null)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Item
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                <TableHead className="text-neutral-600">Title</TableHead>
                <TableHead className="text-neutral-600">Status</TableHead>
                <TableHead className="text-neutral-600">Last Updated</TableHead>
                <TableHead className="text-right text-neutral-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-neutral-500">
                    Loading items...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-neutral-500">
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-neutral-50"
                  onClick={() => onEditItem(item)}
                >
                  <TableCell>
                    <span className="text-neutral-900">{item.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.status === "PUBLISHED" ? "default" : "secondary"}
                      className={
                        item.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : item.status === "ARCHIVED"
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-100"
                          : "bg-neutral-200 text-neutral-700 hover:bg-neutral-200"
                      }
                    >
                      {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-600">{item.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-24 p-0 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                        onClick={() => handlePreview(item.id)}
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                        onClick={() => onEditItem(item)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                      >
                        {item.status === "PUBLISHED" ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Rocket className="w-4 h-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(item);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[900px] w-[calc(100%-2rem)] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>
              Rendered with latest template for this collection
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded bg-white">
            {isPreviewLoading ? (
              <div className="p-6 text-neutral-500">Loading preview...</div>
            ) : (
              <div className="p-0">
                <iframe
                  title="preview"
                  className="w-full h-[60vh] border-0"
                  srcDoc={previewHtml}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[425px] w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the item "
              <span className="font-medium text-neutral-900">
                {itemToDelete?.title}
              </span>
              "? This action cannot be undone.
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
              onClick={handleDeleteItem}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
