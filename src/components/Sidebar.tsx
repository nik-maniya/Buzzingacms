import { 
  FileText, 
  Grid3x3, 
  Image, 
  Menu, 
  ArrowRightLeft, 
  Globe, 
  Search, 
  Archive, 
  Mail, 
  Settings 
} from "lucide-react";
import { cn } from "./ui/utils";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const navSections: NavSection[] = [
    {
      label: "Content",
      items: [
        { id: "pages", label: "Pages", icon: <FileText className="w-4 h-4" /> },
        { id: "dynamic-pages", label: "Dynamic Pages", icon: <Grid3x3 className="w-4 h-4" /> },
        { id: "media", label: "Media Library", icon: <Image className="w-4 h-4" /> },
      ],
    },
    {
      label: "Website Management",
      items: [
        { id: "menus", label: "Menus", icon: <Menu className="w-4 h-4" /> },
        { id: "redirects", label: "Redirects", icon: <ArrowRightLeft className="w-4 h-4" /> },
        { id: "domain", label: "Domain & DNS", icon: <Globe className="w-4 h-4" /> },
      ],
    },
    {
      label: "Utilities",
      items: [
        { id: "seo", label: "SEO Settings", icon: <Search className="w-4 h-4" /> },
        { id: "backups", label: "Backups & Revisions", icon: <Archive className="w-4 h-4" /> },
        { id: "submissions", label: "Contact Submissions", icon: <Mail className="w-4 h-4" /> },
        { id: "settings", label: "System Settings", icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <aside className="w-[260px] bg-neutral-900 text-neutral-100 h-screen flex flex-col border-r border-neutral-800">
      <div className="p-6 border-b border-neutral-800">
        <h1 className="tracking-tight text-neutral-100">
          Buzzinga <span className="text-yellow-400">CMS</span>
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-6">
            <div className="px-4 mb-2">
              <span className="text-[11px] uppercase tracking-wider text-neutral-500">
                {section.label}
              </span>
            </div>
            <div className="space-y-1 px-2">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left relative",
                    activeView === item.id
                      ? "bg-neutral-800 text-neutral-100"
                      : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50"
                  )}
                >
                  {activeView === item.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-yellow-400 rounded-full" />
                  )}
                  {item.icon}
                  <span className="text-[14px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-blue-500" />
          <div>
            <div className="text-sm text-neutral-100">Admin</div>
            <div className="text-xs text-neutral-500">admin@buzzinga.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
