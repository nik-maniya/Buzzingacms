import { useState } from "react";
import { CollectionsHome } from "./CollectionsHome";
import { CollectionView } from "./CollectionView";
import { ItemEditor } from "./ItemEditor";

export interface Collection {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
  lastUpdated: string;
  slugPrefix: string;
  fields: Field[];
}

export interface Field {
  id: string;
  name: string;
  type: "text" | "longtext" | "image" | "dropdown" | "boolean" | "date" | "tags";
  required: boolean;
  options?: string[];
}

export interface Item {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  lastUpdated: string;
  fields: Record<string, any>;
}

export function DynamicPages() {
  const [currentView, setCurrentView] = useState<"home" | "collection" | "item">("home");
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleOpenCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setCurrentView("collection");
  };

  const handleBackToHome = () => {
    setCurrentView("home");
    setSelectedCollection(null);
  };

  const handleEditItem = (item: Item | null) => {
    setSelectedItem(item);
    setCurrentView("item");
  };

  const handleBackToCollection = () => {
    setCurrentView("collection");
    setSelectedItem(null);
  };

  return (
    <>
      {currentView === "home" && (
        <CollectionsHome onOpenCollection={handleOpenCollection} />
      )}
      {currentView === "collection" && selectedCollection && (
        <CollectionView
          collection={selectedCollection}
          onBack={handleBackToHome}
          onEditItem={handleEditItem}
        />
      )}
      {currentView === "item" && selectedCollection && (
        <ItemEditor
          collection={selectedCollection}
          item={selectedItem}
          onBack={handleBackToCollection}
        />
      )}
    </>
  );
}
