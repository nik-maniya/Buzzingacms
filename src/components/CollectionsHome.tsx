import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { CollectionCard } from "./CollectionCard";
import { Collection } from "./DynamicPages";

interface CollectionsHomeProps {
  onOpenCollection: (collection: Collection) => void;
}

export function CollectionsHome({ onOpenCollection }: CollectionsHomeProps) {
  const [collections] = useState<Collection[]>([
    {
      id: "1",
      name: "Blog",
      icon: "📝",
      itemCount: 12,
      lastUpdated: "Oct 29, 2025",
      slugPrefix: "/blog/",
      fields: [
        { id: "1", name: "Title", type: "text", required: true },
        { id: "2", name: "Slug", type: "text", required: true },
        { id: "3", name: "Summary", type: "longtext", required: false },
        { id: "4", name: "Body", type: "longtext", required: true },
        { id: "5", name: "Cover Image", type: "image", required: false },
        { id: "6", name: "Tags", type: "tags", required: false },
      ],
    },
    {
      id: "2",
      name: "Services",
      icon: "🧩",
      itemCount: 6,
      lastUpdated: "Oct 25, 2025",
      slugPrefix: "/services/",
      fields: [
        { id: "1", name: "Title", type: "text", required: true },
        { id: "2", name: "Slug", type: "text", required: true },
        { id: "3", name: "Description", type: "longtext", required: true },
        { id: "4", name: "Icon", type: "image", required: false },
      ],
    },
    {
      id: "3",
      name: "Case Studies",
      icon: "📁",
      itemCount: 8,
      lastUpdated: "Oct 20, 2025",
      slugPrefix: "/case-studies/",
      fields: [
        { id: "1", name: "Title", type: "text", required: true },
        { id: "2", name: "Slug", type: "text", required: true },
        { id: "3", name: "Client", type: "text", required: true },
        { id: "4", name: "Overview", type: "longtext", required: true },
        { id: "5", name: "Featured Image", type: "image", required: false },
      ],
    },
  ]);

  return (
    <div className="flex-1 flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <h2 className="text-neutral-900">Dynamic Pages</h2>
          <Button className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500">
            <Plus className="w-4 h-4 mr-2" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onOpen={() => onOpenCollection(collection)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
