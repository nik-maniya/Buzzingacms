import { useState } from "react";
import { Upload, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";

export function MetadataPanel() {
  const [isPublished, setIsPublished] = useState(true);
  const [metaTitle, setMetaTitle] = useState("Home - Buzzinga");
  const [metaDescription, setMetaDescription] = useState("Welcome to Buzzinga CMS");
  const [coverImage, setCoverImage] = useState<string | null>(null);

  return (
    <aside className="w-[340px] border-l border-neutral-200 bg-neutral-50 overflow-auto">
      <div className="p-6 space-y-6">
        {/* Status */}
        <div className="space-y-4">
          <div>
            <h3 className="text-neutral-900 mb-4">Publishing</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="published" className="text-sm text-neutral-600">
                Published
              </Label>
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
          </div>
        </div>

        <Separator className="bg-neutral-200" />

        {/* SEO Metadata */}
        <div className="space-y-4">
          <h3 className="text-neutral-900">SEO Metadata</h3>
          
          <div className="space-y-2">
            <Label htmlFor="meta-title" className="text-sm text-neutral-600">
              Meta Title
            </Label>
            <Input
              id="meta-title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="bg-white border-neutral-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-description" className="text-sm text-neutral-600">
              Meta Description
            </Label>
            <Textarea
              id="meta-description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              className="bg-white border-neutral-200 resize-none"
            />
          </div>
        </div>

        <Separator className="bg-neutral-200" />

        {/* Cover Image */}
        <div className="space-y-4">
          <h3 className="text-neutral-900">Cover Image</h3>
          
          {coverImage ? (
            <div className="relative">
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-40 object-cover rounded-lg border border-neutral-200"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCoverImage(null)}
                className="absolute top-2 right-2"
              >
                Remove
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setCoverImage("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800")}
              className="w-full h-40 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-neutral-400 hover:bg-neutral-100 transition-colors"
            >
              <Upload className="w-6 h-6 text-neutral-400" />
              <span className="text-sm text-neutral-600">Upload Image</span>
            </button>
          )}
        </div>

        <Separator className="bg-neutral-200" />

        {/* Last Updated */}
        <div className="space-y-2">
          <h3 className="text-neutral-900">Last Updated</h3>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Calendar className="w-4 h-4" />
            <span>Oct 28, 2025 at 2:34 PM</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4">
          <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-neutral-900">
            {isPublished ? "Update Page" : "Publish Page"}
          </Button>
          <Button variant="outline" className="w-full border-neutral-300">
            Save Draft
          </Button>
        </div>
      </div>
    </aside>
  );
}
