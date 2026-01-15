import { useEffect, useState } from "react";
import { CollectionsHome } from "./CollectionsHome";
import { CollectionView } from "./CollectionView";
import { ItemEditor } from "./ItemEditor";
import { collectionItemsAPI, collectionsAPI } from "../services/api";

export interface Collection {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
  lastUpdated: string;
  slug: string;
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

  // Push URL reflecting current state
  const pushUrl = (collection?: Collection | null, item?: Item | null) => {
    const base = "/dynamic-pages";
    let path = base;
    if (collection) {
      path += `/${collection.slug}`;
      if (item && item.slug) {
        path += `/${item.slug}`;
      }
    }
    window.history.replaceState({}, "", path);
  };

  const handleOpenCollection = (collection: Collection, tab?: string) => {
    setSelectedCollection(collection);
    setCurrentView("collection");
    setInitialTab(tab);
    pushUrl(collection, null);
  };

  const handleBackToHome = () => {
    setCurrentView("home");
    setSelectedCollection(null);
    setInitialTab(undefined);
    pushUrl(null, null);
  };

  const handleEditItem = (item: Item | null) => {
    setSelectedItem(item);
    setCurrentView("item");
    if (selectedCollection && item) {
      pushUrl(selectedCollection, item);
    }
  };

  const handleBackToCollection = () => {
    setCurrentView("collection");
    setSelectedItem(null);
    if (selectedCollection) {
      pushUrl(selectedCollection, null);
    }
  };

  // On mount, parse URL and open corresponding collection/item by slug
  useEffect(() => {
    const openFromUrl = async () => {
      const path = window.location.pathname;
      if (!path.startsWith("/dynamic-pages")) return;
      const parts = path.split("/").filter(Boolean); // ["dynamic-pages", collectionSlug?, itemSlug?]
      if (parts.length < 2) return; // only /dynamic-pages

      const collectionSlug = parts[1];
      let itemSlug: string | undefined = undefined;
      if (parts.length >= 3) itemSlug = parts[2];

      try {
        // fetch collections to find matching slug
        const res = await collectionsAPI.getAll();
        if (!res.data?.success) return;
        const list: any[] = res.data.data || [];
        const found = list.find((c) => c.slug === collectionSlug);
        if (!found) return;
        // build minimal Collection object similar to CollectionsHome.transform
        const col: Collection = {
          id: String(found.id),
          name: found.name,
          icon: "📄",
          itemCount: found._count?.items || 0,
          lastUpdated: new Date(found.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          slug: found.slug,
          slugPrefix: `/${found.slug}/`,
          fields: Array.isArray(found.fields) ? found.fields.map((f: any) => ({ id: f.id, name: f.fieldLabel, type: f.fieldType, required: !!f.required, options: [] })) : [],
        };
        setSelectedCollection(col);
        setCurrentView(itemSlug ? "item" : "collection");
        setInitialTab(undefined);

        if (itemSlug) {
          // fetch items to find matching item slug
          const itemsRes = await collectionItemsAPI.getAll(col.id);
          if (itemsRes.data?.success) {
            const apiItems: any[] = itemsRes.data.data || [];
            const match = apiItems.find((it) => (it.data?.slug || "") === itemSlug);
            if (match) {
              const it: Item = {
                id: String(match.id),
                title: match.data?.title || "Untitled",
                slug: match.data?.slug || "",
                status: (match.status || "DRAFT").toUpperCase(),
                lastUpdated: new Date(match.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                fields: match.data || {},
              };
              setSelectedItem(it);
            }
          }
        }
      } catch {
        // ignore
      }
    };

    openFromUrl();

    const onPop = () => openFromUrl();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
