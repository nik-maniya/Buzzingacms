import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Collection, Item } from "./DynamicPages";
import { CollectionItemsList } from "./CollectionItemsList";
import { FieldsStructure } from "./FieldsStructure";
import { CollectionSettings } from "./CollectionSettings";

interface CollectionViewProps {
  collection: Collection;
  onBack: () => void;
  onEditItem: (item: Item | null) => void;
}

export function CollectionView({ collection, onBack, onEditItem }: CollectionViewProps) {
  const [activeTab, setActiveTab] = useState("items");

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-neutral-200" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">{collection.icon}</span>
              <h2 className="text-neutral-900">{collection.name}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-neutral-200 px-8 bg-white">
            <TabsList className="bg-transparent h-12 p-0 space-x-1">
              <TabsTrigger
                value="items"
                className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
              >
                Items
              </TabsTrigger>
              <TabsTrigger
                value="fields"
                className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
              >
                Fields & Structure
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="items" className="h-full m-0">
              <CollectionItemsList collection={collection} onEditItem={onEditItem} />
            </TabsContent>

            <TabsContent value="fields" className="h-full m-0 p-8 overflow-auto bg-neutral-50">
              <FieldsStructure collection={collection} />
            </TabsContent>

            <TabsContent value="settings" className="h-full m-0 p-8 overflow-auto bg-neutral-50">
              <CollectionSettings collection={collection} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
