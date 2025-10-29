import { useState } from "react";
import { ArrowLeft, Plus, GripVertical, Trash2, Save } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { cn } from "./ui/utils";
import { MenuItem } from "./Menus";

interface MenuEditorProps {
  menuId: string;
  onBack: () => void;
}

const ItemTypes = {
  MENU_ITEM: "menuItem",
};

interface DraggableMenuItemProps {
  item: MenuItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  updateItem: (index: number, updates: Partial<MenuItem>) => void;
  deleteItem: (index: number) => void;
  isSubmenu?: boolean;
}

function DraggableMenuItem({
  item,
  index,
  moveItem,
  updateItem,
  deleteItem,
  isSubmenu = false,
}: DraggableMenuItemProps) {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.MENU_ITEM,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.MENU_ITEM,
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => dragPreview(drop(node))}
      className={cn(
        "bg-white border border-neutral-200 rounded-lg transition-all",
        isSubmenu && "ml-12",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <div
          ref={drag}
          className="cursor-move text-neutral-400 hover:text-neutral-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-neutral-600">Label</Label>
            <Input
              value={item.label}
              onChange={(e) => updateItem(index, { label: e.target.value })}
              placeholder="Menu label"
              className="h-9 border-neutral-200"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-neutral-600">Link</Label>
            <Input
              value={item.link}
              onChange={(e) => updateItem(index, { link: e.target.value })}
              placeholder="/page or https://..."
              className="h-9 border-neutral-200"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => deleteItem(index)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function MenuEditor({ menuId, onBack }: MenuEditorProps) {
  const [menuName, setMenuName] = useState(
    menuId === "new" ? "New Menu" : "Header Menu"
  );
  const [items, setItems] = useState<MenuItem[]>(
    menuId === "new"
      ? []
      : [
          { id: "1", label: "Home", link: "/", isInternal: true },
          { id: "2", label: "About", link: "/about", isInternal: true },
          { id: "3", label: "Services", link: "/services", isInternal: true },
          { id: "4", label: "Products", link: "/products", isInternal: true },
          { id: "5", label: "Blog", link: "/blog", isInternal: true },
          { id: "6", label: "Contact", link: "/contact", isInternal: true },
        ]
  );

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: Date.now().toString(),
      label: "",
      link: "",
      isInternal: true,
    };
    setItems([...items, newItem]);
  };

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const newItems = [...items];
    const draggedItem = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, draggedItem);
    setItems(newItems);
  };

  const updateItem = (index: number, updates: Partial<MenuItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const deleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Validation
    const hasEmptyFields = items.some((item) => !item.label || !item.link);
    if (hasEmptyFields) {
      toast.error("Please fill in all menu items");
      return;
    }

    toast.success("Menu saved successfully");
    onBack();
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
        {/* Top Bar */}
        <div className="border-b border-neutral-200 bg-white">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
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
                <h2 className="text-neutral-900">Edit Menu</h2>
              </div>
              <Button
                className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
                onClick={handleSave}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Menu
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Menu Name */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="menu-name">Menu Name</Label>
                <Input
                  id="menu-name"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  placeholder="e.g., Header Menu, Footer Menu"
                  className="border-neutral-200"
                />
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-neutral-900">Menu Items</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addMenuItem}
                  className="border-neutral-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-neutral-300 p-12 text-center">
                  <p className="text-neutral-500 mb-4">No menu items yet</p>
                  <Button
                    variant="outline"
                    onClick={addMenuItem}
                    className="border-neutral-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add your first link
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <DraggableMenuItem
                      key={item.id}
                      item={item}
                      index={index}
                      moveItem={moveItem}
                      updateItem={updateItem}
                      deleteItem={deleteItem}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Helper Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Drag items to reorder them. Use internal paths like{" "}
                <code className="px-1 py-0.5 bg-blue-100 rounded">/about</code> or external URLs
                like{" "}
                <code className="px-1 py-0.5 bg-blue-100 rounded">
                  https://example.com
                </code>
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Save Button (Mobile) */}
        <div className="lg:hidden border-t border-neutral-200 bg-white p-4">
          <Button
            className="w-full bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Menu
          </Button>
        </div>
      </div>
    </DndProvider>
  );
}
