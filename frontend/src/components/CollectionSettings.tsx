import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Collection } from "./DynamicPages";

interface CollectionSettingsProps {
  collection: Collection;
}

export function CollectionSettings({ collection }: CollectionSettingsProps) {
  const [slugPrefix, setSlugPrefix] = useState(collection.slugPrefix);
  const [metaTitleFormat, setMetaTitleFormat] = useState("{title} | Buzzinga");
  const [publishRule, setPublishRule] = useState("manual");
  const [isActive, setIsActive] = useState(true);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h3 className="text-neutral-900">Collection Settings</h3>
        <p className="text-sm text-neutral-600 mt-1">
          Configure how your {collection.name.toLowerCase()} collection behaves
        </p>
      </div>

      {/* URL Settings */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle>URL Configuration</CardTitle>
          <CardDescription>Define how URLs are generated for items in this collection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug-prefix">Slug Prefix</Label>
            <Input
              id="slug-prefix"
              value={slugPrefix}
              onChange={(e) => setSlugPrefix(e.target.value)}
              placeholder="/blog/"
              className="border-neutral-200"
            />
            <p className="text-sm text-neutral-500">
              Example: {slugPrefix}how-ai-speeds-sdlc
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle>SEO & Metadata</CardTitle>
          <CardDescription>Default metadata configuration for this collection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta-title">Meta Title Format</Label>
            <Input
              id="meta-title"
              value={metaTitleFormat}
              onChange={(e) => setMetaTitleFormat(e.target.value)}
              placeholder="{title} | Site Name"
              className="border-neutral-200"
            />
            <p className="text-sm text-neutral-500">
              Use {"{title}"} as placeholder for item title
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Settings */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle>Publishing</CardTitle>
          <CardDescription>Control how items are published</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publish-rule">Publish Rule</Label>
            <Select value={publishRule} onValueChange={setPublishRule}>
              <SelectTrigger id="publish-rule" className="border-neutral-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (Draft by default)</SelectItem>
                <SelectItem value="auto">Auto-publish on create</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <div className="space-y-0.5">
              <Label htmlFor="active-toggle">Collection Active</Label>
              <p className="text-sm text-neutral-500">
                Inactive collections are hidden from public view
              </p>
            </div>
            <Switch
              id="active-toggle"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
