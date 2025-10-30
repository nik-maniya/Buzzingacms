import { useState } from "react";
import { Upload, Search, Grid3x3, List, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { MediaCard } from "./MediaCard";
import { MediaListRow } from "./MediaListRow";
import { MediaDetailDrawer } from "./MediaDetailDrawer";
import { UploadModal } from "./UploadModal";
import { EmptyMediaState } from "./EmptyMediaState";
import { cn } from "./ui/utils";

export interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "other";
  url: string;
  thumbnail: string;
  size: string;
  dimensions?: string;
  uploadDate: string;
  altText?: string;
  tags?: string[];
  usedIn?: string[];
}

export function MediaLibrary() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Sample media data
  const [mediaFiles] = useState<MediaFile[]>([
    {
      id: "1",
      name: "hero-image.png",
      type: "image",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
      size: "1.2 MB",
      dimensions: "1920 × 1080",
      uploadDate: "Oct 29, 2025",
      altText: "Modern abstract hero image",
      tags: ["hero", "abstract", "design"],
      usedIn: ["Homepage", "About Page"],
    },
    {
      id: "2",
      name: "team-photo.jpg",
      type: "image",
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
      thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400",
      size: "2.4 MB",
      dimensions: "2400 × 1600",
      uploadDate: "Oct 28, 2025",
      altText: "Team collaboration meeting",
      tags: ["team", "people", "office"],
      usedIn: ["About Page", "Team Section"],
    },
    {
      id: "3",
      name: "product-demo.mp4",
      type: "video",
      url: "#",
      thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113",
      size: "15.6 MB",
      uploadDate: "Oct 27, 2025",
      tags: ["video", "demo", "product"],
      usedIn: ["Features Page"],
    },
    {
      id: "4",
      name: "company-deck.pdf",
      type: "document",
      url: "#",
      thumbnail: "https://images.unsplash.com/photo-1568667256549-094345857637",
      size: "4.8 MB",
      uploadDate: "Oct 26, 2025",
      tags: ["document", "presentation"],
      usedIn: [],
    },
    {
      id: "5",
      name: "office-space.jpg",
      type: "image",
      url: "https://images.unsplash.com/photo-1497366216548-37526070297c",
      thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
      size: "1.8 MB",
      dimensions: "1920 × 1280",
      uploadDate: "Oct 25, 2025",
      tags: ["office", "workspace", "interior"],
      usedIn: ["About Page"],
    },
    {
      id: "6",
      name: "brand-logo.svg",
      type: "image",
      url: "https://images.unsplash.com/photo-1634942537034-2531766767d1",
      thumbnail: "https://images.unsplash.com/photo-1634942537034-2531766767d1?w=400",
      size: "24 KB",
      uploadDate: "Oct 24, 2025",
      tags: ["logo", "branding", "svg"],
      usedIn: ["Homepage", "About Page", "Contact"],
    },
  ]);

  const filteredFiles = mediaFiles.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = fileTypeFilter === "all" || file.type === fileTypeFilter;
    return matchesSearch && matchesType;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      case "a-z":
        return a.name.localeCompare(b.name);
      case "size":
        return parseFloat(b.size) - parseFloat(a.size);
      default: // newest
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    }
  });

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const hasFiles = mediaFiles.length > 0;

  return (
    <div className="flex-1 flex overflow-hidden bg-neutral-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b border-neutral-200 bg-white">
          <div className="px-8 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-neutral-900">Media Library</h2>
              <Button
                className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Media
              </Button>
            </div>

            {hasFiles && (
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    placeholder="Search by name, tag, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-neutral-200"
                  />
                </div>

                {/* Filter Dropdowns */}
                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger className="w-[140px] border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="a-z">A-Z</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex items-center gap-1 border border-neutral-200 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      viewMode === "grid" && "bg-neutral-100"
                    )}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      viewMode === "list" && "bg-neutral-100"
                    )}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Batch Actions Bar */}
        {selectedFiles.length > 0 && (
          <div className="border-b border-neutral-200 bg-blue-50 px-8 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-900">
                {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-neutral-300">
                  Add Tags
                </Button>
                <Button variant="outline" size="sm" className="border-neutral-300">
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {!hasFiles ? (
            <EmptyMediaState onUpload={() => setIsUploadModalOpen(true)} />
          ) : viewMode === "grid" ? (
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedFiles.map((file) => (
                  <MediaCard
                    key={file.id}
                    file={file}
                    isSelected={selectedFiles.includes(file.id)}
                    onSelect={() => toggleFileSelection(file.id)}
                    onClick={() => setSelectedFile(file)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm text-neutral-600 w-12"></th>
                      <th className="text-left px-4 py-3 text-sm text-neutral-600">Preview</th>
                      <th className="text-left px-4 py-3 text-sm text-neutral-600">File Name</th>
                      <th className="text-left px-4 py-3 text-sm text-neutral-600">Type</th>
                      <th className="text-left px-4 py-3 text-sm text-neutral-600">Size</th>
                      <th className="text-left px-4 py-3 text-sm text-neutral-600">Uploaded</th>
                      <th className="text-right px-4 py-3 text-sm text-neutral-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFiles.map((file) => (
                      <MediaListRow
                        key={file.id}
                        file={file}
                        isSelected={selectedFiles.includes(file.id)}
                        onSelect={() => toggleFileSelection(file.id)}
                        onClick={() => setSelectedFile(file)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedFile && (
        <MediaDetailDrawer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
