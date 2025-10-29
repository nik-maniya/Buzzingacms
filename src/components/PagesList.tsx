import { useState } from "react";
import { Search, Plus, Edit2, Lock, Rocket, Copy, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface Page {
  id: string;
  title: string;
  status: "published" | "draft";
  lastUpdated: string;
}

interface PagesListProps {
  onEditPage: (pageId: string) => void;
  onNewPage: () => void;
}

export function PagesList({ onEditPage, onNewPage }: PagesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const pages: Page[] = [
    { id: "1", title: "Home", status: "published", lastUpdated: "Oct 28, 2025" },
    { id: "2", title: "About", status: "draft", lastUpdated: "Oct 20, 2025" },
    { id: "3", title: "Contact", status: "published", lastUpdated: "Oct 15, 2025" },
    { id: "4", title: "Services", status: "published", lastUpdated: "Oct 10, 2025" },
    { id: "5", title: "Case Studies", status: "draft", lastUpdated: "Oct 5, 2025" },
  ];

  const filteredPages = pages.filter((page) => {
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-neutral-900">Pages</h2>
            <Button onClick={onNewPage} className="bg-yellow-400 hover:bg-yellow-500 text-neutral-900">
              <Plus className="w-4 h-4 mr-2" />
              New Page
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search pages…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-neutral-50 border-neutral-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-neutral-50 border-neutral-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
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
              {filteredPages.map((page) => (
                <TableRow 
                  key={page.id} 
                  className="cursor-pointer hover:bg-neutral-50"
                  onClick={() => onEditPage(page.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-900">{page.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={page.status === "published" ? "default" : "secondary"}
                      className={
                        page.status === "published"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-neutral-200 text-neutral-700 hover:bg-neutral-200"
                      }
                    >
                      {page.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-600">{page.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                        onClick={() => onEditPage(page.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                      >
                        {page.status === "published" ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Rocket className="w-4 h-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
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
