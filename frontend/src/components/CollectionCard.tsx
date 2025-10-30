import { Settings, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Collection } from "./DynamicPages";

interface CollectionCardProps {
  collection: Collection;
  onOpen: () => void;
}

export function CollectionCard({ collection, onOpen }: CollectionCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all border-neutral-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{collection.icon}</span>
            <div>
              <h3 className="text-neutral-900">{collection.name}</h3>
              <p className="text-sm text-neutral-500">{collection.itemCount} items</p>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-neutral-600 hover:text-neutral-900"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-neutral-600 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-neutral-600">Last updated {collection.lastUpdated}</p>
      </CardContent>
      <CardFooter className="pt-3 border-t border-neutral-100">
        <Button
          variant="outline"
          className="w-full border-neutral-200 hover:bg-neutral-50"
          onClick={onOpen}
        >
          Open
        </Button>
      </CardFooter>
    </Card>
  );
}
