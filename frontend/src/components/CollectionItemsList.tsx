import { useState } from "react";
import { Plus, Search, Edit2, Copy, Trash2, Lock, Rocket, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Collection, Item } from "./DynamicPages";

interface CollectionItemsListProps {
  collection: Collection;
  onEditItem: (item: Item | null) => void;
}

export function CollectionItemsList({ collection, onEditItem }: CollectionItemsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");

  const [items] = useState<Item[]>([
    {
      id: "1",
      title: "How AI speeds SDLC",
      slug: "how-ai-speeds-sdlc",
      status: "published",
      lastUpdated: "Oct 29, 2025",
      fields: {},
    },
    {
      id: "2",
      title: "Introducing ForecxtIQ",
      slug: "introducing-forecxtiq",
      status: "draft",
      lastUpdated: "Oct 25, 2025",
      fields: {},
    },
    {
      id: "3",
      title: "Building AI-native CMS",
      slug: "building-ai-native-cms",
      status: "published",
      lastUpdated: "Oct 20, 2025",
      fields: {},
    },
  ]);

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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
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
              {filteredItems.map((item) => (
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
                      variant={item.status === "published" ? "default" : "secondary"}
                      className={
                        item.status === "published"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-neutral-200 text-neutral-700 hover:bg-neutral-200"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-600">{item.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
                        {item.status === "published" ? (
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
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
