import { useState } from "react";
import { Plus, Search, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Menu } from "./Menus";

interface MenusListProps {
  onEditMenu: (menuId: string) => void;
  onNewMenu: () => void;
}

export function MenusList({ onEditMenu, onNewMenu }: MenusListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample menus data
  const [menus] = useState<Menu[]>([
    {
      id: "1",
      name: "Header Menu",
      items: [
        { id: "1", label: "Home", link: "/", isInternal: true },
        { id: "2", label: "About", link: "/about", isInternal: true },
        { id: "3", label: "Services", link: "/services", isInternal: true },
        {
          id: "4",
          label: "Products",
          link: "/products",
          isInternal: true,
          submenu: [
            { id: "4a", label: "Product A", link: "/products/a", isInternal: true },
            { id: "4b", label: "Product B", link: "/products/b", isInternal: true },
          ],
        },
        { id: "5", label: "Blog", link: "/blog", isInternal: true },
        { id: "6", label: "Contact", link: "/contact", isInternal: true },
      ],
      lastUpdated: "Oct 29, 2025",
    },
    {
      id: "2",
      name: "Footer Menu",
      items: [
        { id: "1", label: "Privacy Policy", link: "/privacy", isInternal: true },
        { id: "2", label: "Terms of Service", link: "/terms", isInternal: true },
        { id: "3", label: "Careers", link: "/careers", isInternal: true },
        { id: "4", label: "Support", link: "https://support.buzzinga.com", isInternal: false },
      ],
      lastUpdated: "Oct 27, 2025",
    },
  ]);

  const filteredMenus = menus.filter((menu) =>
    menu.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const countMenuItems = (menu: Menu): number => {
    return menu.items.reduce((count, item) => {
      return count + 1 + (item.submenu ? item.submenu.length : 0);
    }, 0);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
      {/* Top Bar */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="px-8 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-neutral-900">Menus</h2>
            <Button
              className="bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
              onClick={onNewMenu}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Menu
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search menus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-neutral-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Menus Table */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm text-neutral-600">Menu Name</th>
                  <th className="text-left px-6 py-3 text-sm text-neutral-600">Items</th>
                  <th className="text-left px-6 py-3 text-sm text-neutral-600">Last Updated</th>
                  <th className="text-right px-6 py-3 text-sm text-neutral-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMenus.map((menu) => (
                  <tr
                    key={menu.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => onEditMenu(menu.id)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-900">{menu.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-600">{countMenuItems(menu)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-600">{menu.lastUpdated}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-neutral-600 hover:text-neutral-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditMenu(menu.id);
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMenus.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-neutral-500">No menus found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
