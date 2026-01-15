import { useState } from "react";
import { Calendar, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Item } from "./DynamicPages";

interface ItemMetadataPanelProps {
  item: Item | null;
}

export function ItemMetadataPanel({ item }: ItemMetadataPanelProps) {
  const [isPublished, setIsPublished] = useState(item?.status === "PUBLISHED");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  return (
    <div 
      className="border-l border-neutral-200 bg-neutral-50 flex flex-col overflow-hidden flex-shrink-0"
      style={{ width: "320px", minWidth: "320px", maxWidth: "320px" }}
    >
      <style>{`
        .metadata-sidebar,
        .metadata-sidebar * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .metadata-sidebar img,
        .metadata-sidebar img[src*="logo"],
        .metadata-sidebar img[alt*="logo"],
        .metadata-sidebar img[alt*="Logo"],
        .metadata-sidebar .logo,
        .metadata-sidebar [class*="logo"],
        .metadata-sidebar [id*="logo"] {
          max-width: 100% !important;
          width: auto !important;
          height: auto !important;
          display: block;
          box-sizing: border-box !important;
        }
      `}</style>
      <div className="p-6 space-y-6 overflow-auto flex-1 metadata-sidebar">
        {/* Publish Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="publish-toggle">Status</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">
                {isPublished ? "Published" : "Draft"}
              </span>
              <Switch
                id="publish-toggle"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
          </div>

          <Separator className="bg-neutral-200" />

          {item && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4" />
              <span>Updated {item.lastUpdated}</span>
            </div>
          )}
        </div>

        {/* SEO Meta */}
        <div className="space-y-4">
          <h3 className="text-neutral-900 text-sm">SEO & Metadata</h3>
          
          <div className="space-y-2">
            <Label htmlFor="meta-title" className="text-sm">Meta Title</Label>
            <Input
              id="meta-title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Item title | Site Name"
              className="border-neutral-200 text-sm"
            />
            <p className="text-xs text-neutral-500">
              {metaTitle.length}/60 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-description" className="text-sm">Meta Description</Label>
            <Textarea
              id="meta-description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Brief description for search engines..."
              className="border-neutral-200 text-sm min-h-[80px] resize-none"
            />
            <p className="text-xs text-neutral-500">
              {metaDescription.length}/160 characters
            </p>
          </div>
        </div>

        {/* Featured Image */}
        <div className="space-y-2">
          <Label className="text-sm">Featured Image</Label>
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-neutral-400 transition-colors cursor-pointer overflow-hidden">
            <style>{`
              .featured-image-container img,
              .featured-image-container * {
                max-width: 100% !important;
                width: auto !important;
                height: auto !important;
                display: block;
                box-sizing: border-box;
              }
            `}</style>
            <div className="featured-image-container w-full">
              <p className="text-xs text-neutral-500">Upload image</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons */}
      <div className="border-t border-neutral-200 p-4 bg-white space-y-2">
        <Button className="w-full bg-yellow-400 text-neutral-900 hover:bg-yellow-500">
          <Save className="w-4 h-4 mr-2" />
          {item ? "Save Changes" : "Publish"}
        </Button>
        <Button variant="outline" className="w-full border-neutral-200">
          Save as Draft
        </Button>
      </div>
    </div>
  );
}
