import { X, Copy, Upload, Trash2, ExternalLink, FileText, Film, FileImage } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { MediaFile } from "./MediaLibrary";
import { toast } from "sonner";
import { copyToClipboard } from "./ui/copy-to-clipboard";

interface MediaDetailDrawerProps {
  file: MediaFile;
  onClose: () => void;
}

const typeIcons = {
  image: FileImage,
  video: Film,
  document: FileText,
  other: FileText,
};

export function MediaDetailDrawer({ file, onClose }: MediaDetailDrawerProps) {
  const Icon = typeIcons[file.type];

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(file.url);
    if (success) {
      toast.success("URL copied to clipboard");
    } else {
      toast.error("Failed to copy URL. Please copy manually.");
    }
  };

  return (
    <div className="w-96 border-l border-neutral-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <h3 className="text-neutral-900">File Details</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Preview */}
        <div className="p-6 bg-neutral-50 border-b border-neutral-200">
          <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center">
            {file.type === "image" ? (
              <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
            ) : (
              <Icon className="w-16 h-16 text-neutral-400" />
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename">File Name</Label>
            <Input
              id="filename"
              value={file.name}
              className="border-neutral-200"
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg">
                <Icon className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-900 capitalize">{file.type}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <div className="px-3 py-2 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-900">{file.size}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Uploaded</Label>
            <div className="px-3 py-2 bg-neutral-50 rounded-lg">
              <span className="text-sm text-neutral-900">{file.uploadDate}</span>
            </div>
          </div>

          {file.dimensions && (
            <div className="space-y-2">
              <Label>Dimensions</Label>
              <div className="px-3 py-2 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-900">{file.dimensions}</span>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-neutral-200" />

        {/* Metadata */}
        <div className="p-6 space-y-4">
          <h4 className="text-sm text-neutral-900">Metadata</h4>

          <div className="space-y-2">
            <Label htmlFor="alt-text">Alt Text</Label>
            <Textarea
              id="alt-text"
              placeholder="Describe this image for accessibility..."
              defaultValue={file.altText}
              className="border-neutral-200 min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {file.tags?.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-neutral-100 text-neutral-700"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <Input
              id="tags"
              placeholder="Add tags (comma separated)..."
              className="border-neutral-200"
            />
          </div>

          <div className="space-y-2">
            <Label>Public URL</Label>
            <div className="flex gap-2">
              <Input
                value={file.url}
                className="border-neutral-200 text-sm"
                readOnly
              />
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-200 shrink-0"
                onClick={handleCopyUrl}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="bg-neutral-200" />

        {/* Used In */}
        <div className="p-6 space-y-4">
          <h4 className="text-sm text-neutral-900">Used In</h4>
          {file.usedIn && file.usedIn.length > 0 ? (
            <div className="space-y-2">
              {file.usedIn.map((location, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <span className="text-sm text-neutral-900">{location}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Not used in any pages yet</p>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="border-t border-neutral-200 p-4 bg-white space-y-2">
        <Button
          className="w-full bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
          onClick={handleCopyUrl}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Public URL
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 border-neutral-200">
            <Upload className="w-4 h-4 mr-2" />
            Replace
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
