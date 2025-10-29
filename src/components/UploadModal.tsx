import { useState, useCallback } from "react";
import { Upload, X, File, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import { cn } from "./ui/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  altText?: string;
  tags?: string;
  error?: string;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<FileUpload[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const newUploads: FileUpload[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: "pending",
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // Simulate upload process
    newUploads.forEach((upload) => {
      simulateUpload(upload.id);
    });
  };

  const simulateUpload = (uploadId: string) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === uploadId ? { ...u, status: "uploading" as const } : u
      )
    );

    const interval = setInterval(() => {
      setUploads((prev) => {
        const upload = prev.find((u) => u.id === uploadId);
        if (!upload) return prev;

        if (upload.progress >= 100) {
          clearInterval(interval);
          toast.success(`${upload.file.name} uploaded successfully`);
          return prev.map((u) =>
            u.id === uploadId
              ? { ...u, progress: 100, status: "success" as const }
              : u
          );
        }

        return prev.map((u) =>
          u.id === uploadId ? { ...u, progress: u.progress + 10 } : u
        );
      });
    }, 200);
  };

  const removeUpload = (uploadId: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
  };

  const handleClose = () => {
    if (uploads.some((u) => u.status === "uploading")) {
      if (!confirm("Files are still uploading. Are you sure you want to close?")) {
        return;
      }
    }
    setUploads([]);
    onClose();
  };

  const allUploadsComplete = uploads.length > 0 && uploads.every((u) => u.status === "success");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Upload images, videos, or documents to your media library
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Drop Zone */}
          {uploads.length === 0 && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
                isDragging
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
              <p className="text-neutral-900 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-neutral-500">
                Supports: JPG, PNG, GIF, MP4, PDF (Max 50MB)
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                accept="image/*,video/*,.pdf"
              />
            </div>
          )}

          {/* Upload List */}
          {uploads.length > 0 && (
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="border border-neutral-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded flex items-center justify-center">
                      {upload.status === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : upload.status === "error" ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <File className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-900 truncate">
                        {upload.file.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {upload.status === "uploading" && (
                        <div className="mt-2">
                          <Progress value={upload.progress} className="h-1" />
                        </div>
                      )}

                      {upload.status === "success" && (
                        <p className="text-xs text-green-600 mt-1">
                          Upload complete
                        </p>
                      )}

                      {upload.status === "error" && (
                        <p className="text-xs text-red-600 mt-1">
                          {upload.error || "Upload failed"}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900"
                      onClick={() => removeUpload(upload.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {upload.status === "pending" && (
                    <div className="space-y-3 pt-2 border-t border-neutral-200">
                      <div className="space-y-1.5">
                        <Label htmlFor={`alt-${upload.id}`} className="text-xs">
                          Alt Text (Optional)
                        </Label>
                        <Input
                          id={`alt-${upload.id}`}
                          placeholder="Describe this file..."
                          className="h-8 text-sm border-neutral-200"
                          value={upload.altText || ""}
                          onChange={(e) =>
                            setUploads((prev) =>
                              prev.map((u) =>
                                u.id === upload.id
                                  ? { ...u, altText: e.target.value }
                                  : u
                              )
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`tags-${upload.id}`} className="text-xs">
                          Tags (Optional)
                        </Label>
                        <Input
                          id={`tags-${upload.id}`}
                          placeholder="design, hero, homepage..."
                          className="h-8 text-sm border-neutral-200"
                          value={upload.tags || ""}
                          onChange={(e) =>
                            setUploads((prev) =>
                              prev.map((u) =>
                                u.id === upload.id
                                  ? { ...u, tags: e.target.value }
                                  : u
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add More Button */}
              {!uploads.some((u) => u.status === "uploading") && (
                <Button
                  variant="outline"
                  className="w-full border-dashed border-2 border-neutral-300"
                  onClick={() => document.getElementById("file-input-2")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add More Files
                </Button>
              )}
              <input
                id="file-input-2"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                accept="image/*,video/*,.pdf"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
          <Button variant="outline" onClick={handleClose}>
            {allUploadsComplete ? "Done" : "Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
