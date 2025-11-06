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
  type: "text" | "longtext" | "image" | "dropdown" | "boolean" | "date" | "tags" | "radio";
  required: boolean;
  options?: string[];
}

export interface Item {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  lastUpdated: string;
  fields: Record<string, any>;
}

export function DynamicPages() {
  const [currentView, setCurrentView] = useState<"home" | "collection" | "item">("home");
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);

  const handleOpenCollection = (collection: Collection, tab?: string) => {
    setSelectedCollection(collection);
    setCurrentView("collection");
    setInitialTab(tab);
  };

  const handleBackToHome = () => {
    setCurrentView("home");
    setSelectedCollection(null);
    setInitialTab(undefined);
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
          initialTab={initialTab}
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
