import { useState, useEffect, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { CollectionCard } from "./CollectionCard";
import { Collection, Field } from "./DynamicPages";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { collectionsAPI } from "../services/api";

interface CollectionsHomeProps {
  onOpenCollection: (collection: Collection, tab?: string) => void;
}

// Helper function to get icon based on collection name
const getCollectionIcon = (name: string): string => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("blog") || nameLower.includes("post")) return "📝";
  if (nameLower.includes("service")) return "🧩";
  if (nameLower.includes("case") || nameLower.includes("study")) return "📁";
  if (nameLower.includes("product")) return "📦";
  if (nameLower.includes("event")) return "📅";
  return "📄";
};

// Transform API response to Collection format
const transformCollection = (apiCollection: any): Collection => {
  // Handle fields from Field[] relation
  let fields: Field[] = [];
  if (apiCollection.fields && Array.isArray(apiCollection.fields)) {
    fields = apiCollection.fields.map((field: any) => {
      // Parse options from defaultValue if it's JSON
      let options: string[] = [];
      if (field.defaultValue) {
        try {
          const parsed = JSON.parse(field.defaultValue);
          if (Array.isArray(parsed)) {
            options = parsed;
          }
        } catch (e) {
          // Not JSON, keep as empty array
        }
      }

      return {
        id: field.id,
        name: field.fieldLabel,
        type: field.fieldType as Field["type"],
        required: field.required || false,
        options: options,
      };
    });
  } else if (apiCollection.fields && typeof apiCollection.fields === "object") {
    // Fallback: handle JSON object format
    fields = Object.entries(apiCollection.fields).map(([key, value]: [string, any]) => ({
      id: key,
      name: value.name || key,
      type: value.type || "text",
      required: value.required || false,
      options: value.options || [],
    }));
  }

  const updatedDate = new Date(apiCollection.updatedAt);
  const lastUpdated = updatedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return {
    id: apiCollection.id,
    name: apiCollection.name,
    icon: getCollectionIcon(apiCollection.name),
    itemCount: apiCollection._count?.items || 0,
    lastUpdated,
    slugPrefix: `/${apiCollection.slug}/`,
    fields: fields,
  };
};

export function CollectionsHome({ onOpenCollection }: CollectionsHomeProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionSlug, setCollectionSlug] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCollection, setEditCollection] = useState<Collection | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState<Collection | null>(null);

  // Fetch collections on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await collectionsAPI.getAll();
        if (response.data.success) {
          const transformedCollections = response.data.data.map(transformCollection);
          setCollections(transformedCollections);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await collectionsAPI.create({
        name: collectionName,
        slug: collectionSlug,
        fields: {},
      });

      if (response.data.success) {
        // Transform and add new collection to the list
        const newCollection = transformCollection(response.data.data);
        setCollections((prev) => [newCollection, ...prev]);
        
        // Reset form and close dialog
        setCollectionName("");
        setCollectionSlug("");
        setIsDialogOpen(false);
        
        // Redirect to the collection's Fields & Structure tab
        onOpenCollection(newCollection, "fields");
      }
    } catch (error: any) {
      console.error("Error creating collection:", error);
      alert(error.response?.data?.message || "Failed to create collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCollectionName("");
    setCollectionSlug("");
    setIsDialogOpen(false);
  };

  const openEditCollection = (collection: Collection) => {
    setEditCollection(collection);
    setEditName(collection.name);
    // slugPrefix like "/blog/" -> extract slug
    const slug = collection.slugPrefix.replace(/^\//, "").replace(/\/$/, "");
    setEditSlug(slug);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCollection = async (e: FormEvent) => {
    e.preventDefault();
    if (!editCollection) return;
    setIsSubmitting(true);
    try {
      const response = await collectionsAPI.update(editCollection.id, {
        name: editName,
        slug: editSlug,
      });
      if (response.data.success) {
        // Update item in list
        setCollections((prev) =>
          prev.map((c) =>
            c.id === editCollection.id
              ? {
                  ...c,
                  name: editName,
                  slugPrefix: `/${editSlug}/`,
                }
              : c
          )
        );
        setIsEditDialogOpen(false);
        setEditCollection(null);
      }
    } catch (error: any) {
      console.error("Error updating collection:", error);
      alert(error.response?.data?.message || "Failed to update collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteCollection = (collection: Collection) => {
    setDeleteCollectionTarget(collection);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCollection = async () => {
    if (!deleteCollectionTarget) return;
    try {
      const response = await collectionsAPI.delete(deleteCollectionTarget.id);
      if (response.data.success) {
        setCollections((prev) => prev.filter((c) => c.id !== deleteCollectionTarget.id));
        setIsDeleteDialogOpen(false);
        setDeleteCollectionTarget(null);
      }
    } catch (error: any) {
      console.error("Error deleting collection:", error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <h2 className="text-neutral-900">Dynamic Pages</h2>
          <Button 
            className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-neutral-500">Loading collections...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-neutral-500 mb-4">No collections found</p>
            <Button
              className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Collection
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onOpen={() => onOpenCollection(collection)}
                onDelete={() => openDeleteCollection(collection)}
                onEdit={() => openEditCollection(collection)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Collection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[425px] w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Enter the collection name and slug to create a new collection.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="collection-name">Collection Name</Label>
                <Input
                  id="collection-name"
                  placeholder="e.g., Blog, Services, Products"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="collection-slug">Slug</Label>
                <Input
                  id="collection-slug"
                  placeholder="e.g., blog, services, products"
                  value={collectionSlug}
                  onChange={(e) => setCollectionSlug(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Collection"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[425px] w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete
              {" "}
              <span className="font-medium text-neutral-900">
                {deleteCollectionTarget?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDeleteCollection}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[425px] w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>Update the collection name and slug.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCollection}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-collection-name">Collection Name</Label>
                <Input
                  id="edit-collection-name"
                  placeholder="e.g., Blog, Services, Products"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-collection-slug">Slug</Label>
                <Input
                  id="edit-collection-slug"
                  placeholder="e.g., blog, services, products"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
