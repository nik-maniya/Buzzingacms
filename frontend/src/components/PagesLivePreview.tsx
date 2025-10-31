import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Monitor, Tablet, Smartphone, ExternalLink, X } from "lucide-react";
import { PublicPageTemplate } from "./PublicPageTemplate";
import { cn } from "./ui/utils";

interface PagesLivePreviewProps {
  open: boolean;
  onClose: () => void;
}

interface LivePageItem {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | string;
  isHomePage?: boolean;
  contentHtml: string;
  customCss?: string;
  customJs?: string;
}

export function PagesLivePreview({ open, onClose }: PagesLivePreviewProps) {
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [pages, setPages] = useState<LivePageItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const apiBase = (import.meta as any).env?.VITE_API_URL
    ? (import.meta as any).env.VITE_API_URL
    : "http://localhost:5000";

  useEffect(() => {
    if (!open) return;
    // Initialize from URL param if present
    try {
      const url = new URL(window.location.href);
      const fromParam = url.searchParams.get("previewSlug");
      if (fromParam) {
        setSelectedSlug(fromParam.replace(/^\//, ""));
      }
    } catch {}
    const token = localStorage.getItem("token");
    if (!token) {
      setPages([]);
      return;
    }
    setLoading(true);
    fetch(`${apiBase}/api/pages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) throw new Error(res?.message || "Failed to load pages");
        const list = Array.isArray(res?.data) ? res.data : [];
        const mapped: LivePageItem[] = list.map((p: any) => {
          let htmlContent = "";
          if (typeof p.content === "string") {
            htmlContent = p.content;
          } else if (p.content && typeof p.content === "object") {
            htmlContent = p.content.html || p.content.body || "";
          }
          return {
            id: String(p.id),
            title: String(p.title || "Untitled"),
            slug: String(p.slug || ""),
            status: String(p.status || "DRAFT"),
            isHomePage: !!p.isHomePage,
            contentHtml: String(htmlContent || ""),
            customCss: typeof p.customCss === "string" ? p.customCss : undefined,
            customJs: typeof p.customJs === "string" ? p.customJs : undefined,
          };
        });
        // Sort by title for stable nav
        mapped.sort((a, b) => a.title.localeCompare(b.title));
        setPages(mapped);
        // Default select: home page, else first item
        const home = mapped.find((p) => p.isHomePage) || mapped[0];
        setSelectedSlug((home?.slug || "").replace(/^\//, ""));
        setSelectedId(home?.id || "");
      })
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Keep URL in sync with selected slug while modal is open
  useEffect(() => {
    if (!open) return;
    try {
      const url = new URL(window.location.href);
      if (selectedSlug) {
        url.searchParams.set("previewSlug", selectedSlug.replace(/^\//, ""));
      } else {
        url.searchParams.delete("previewSlug");
      }
      window.history.replaceState({}, "", url);
    } catch {}
  }, [open, selectedSlug]);

  // When modal closes, remove the preview param from URL
  useEffect(() => {
    if (open) return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("previewSlug")) {
        url.searchParams.delete("previewSlug");
        window.history.replaceState({}, "", url);
      }
    } catch {}
  }, [open]);

  const selectedPage = useMemo(() => {
    const normalized = (selectedSlug || "").replace(/^\//, "");
    return (
      pages.find((p) => p.slug.replace(/^\//, "") === normalized) ||
      pages.find((p) => p.id === selectedId)
    );
  }, [pages, selectedSlug, selectedId]);

  const headerContent = useMemo(() => {
    if (!pages.length) return "";
    const navLinks = pages
      .map((p) => {
        const href = p.slug ? (p.slug.startsWith("/") ? p.slug : `/${p.slug}`) : "#";
        const isActive = selectedPage && (p.slug
          ? p.slug.replace(/^\//, "") === selectedPage.slug.replace(/^\//, "")
          : p.id === selectedPage.id);
        const attrs = p.slug
          ? `data-slug="${p.slug}"`
          : `data-id="${p.id}"`;
        return `<a href="${href}" ${attrs} style="text-decoration: none; ${isActive ? "font-weight: 600; color: #f59e0b;" : ""}">${p.title}</a>`;
      })
      .join("\n      ");
    return `<div style="display: flex; justify-content: space-between; align-items: center;">
  <h2 style="margin: 0; font-size: 24px; color: #fff;">Buzzinga</h2>
  <nav style="display: flex; gap: 24px;">
    ${navLinks}
  </nav>
</div>`;
  }, [pages, selectedPage]);

  const footerContent = useMemo(() => {
    const year = new Date().getFullYear();
    return `<div style="text-align: left;">
  <p style="margin-bottom: 8px;">&copy; ${year} Buzzinga. All rights reserved.</p>
</div>`;
  }, []);

  // intercept clicks on header nav inside the preview to switch pages without leaving
  const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const anchor = (target.closest("a[data-slug], a[data-id]") as HTMLAnchorElement | null);
    if (anchor) {
      e.preventDefault();
      const slug = anchor.getAttribute("data-slug");
      const id = anchor.getAttribute("data-id");
      if (slug) {
        setSelectedSlug(slug.replace(/^\//, ""));
        setSelectedId("");
      } else if (id) {
        setSelectedId(id);
        setSelectedSlug("");
      }
    }
  };

  const devices = [
    { id: "desktop" as const, label: "Desktop", icon: Monitor },
    { id: "tablet" as const, label: "Tablet", icon: Tablet },
    { id: "mobile" as const, label: "Mobile", icon: Smartphone },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none p-0 gap-0 border-0 rounded-none inset-0 translate-x-0 translate-y-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Live Preview</DialogTitle>
        <DialogDescription className="sr-only">
          Live preview of your pages with a header navigation. Click names to switch.
        </DialogDescription>

        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-white shrink-0">
          <div>
            <h3 className="text-neutral-900">Live Preview</h3>
            <p className="text-sm text-neutral-500">
              {selectedPage ? selectedPage.title : loading ? "Loading…" : "No pages"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              {devices.map((device) => {
                const Icon = device.icon;
                return (
                  <button
                    key={device.id}
                    onClick={() => setDeviceView(device.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm",
                      deviceView === device.id
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{device.label}</span>
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const href = selectedPage?.slug ? (selectedPage.slug.startsWith("/") ? selectedPage.slug : `/${selectedPage.slug}`) : "/";
                window.open(href, "_blank");
              }}
              disabled={!selectedPage}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-neutral-50 flex items-center justify-center">
          <div
            className={cn(
              "h-full bg-white transition-all duration-300 overflow-hidden flex flex-col",
              deviceView === "desktop" && "w-full",
              deviceView === "tablet" && "w-[768px] shadow-2xl",
              deviceView === "mobile" && "w-[375px] shadow-2xl"
            )}
          >
            <div className="flex-1 overflow-auto preview-scrollbar" onClick={handleHeaderClick}>
              <style>{`
                .preview-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
                .preview-scrollbar::-webkit-scrollbar-track { background: #f5f5f5; border-radius: 5px; }
                .preview-scrollbar::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 5px; }
                .preview-scrollbar::-webkit-scrollbar-thumb:hover { background: #a3a3a3; }
                .preview-scrollbar { scrollbar-width: thin; scrollbar-color: #d4d4d4 #f5f5f5; }
              `}</style>
              <PublicPageTemplate
                headerContent={headerContent}
                bodyContent={selectedPage?.contentHtml || ""}
                footerContent={footerContent}
                pageTitle={selectedPage?.title || ""}
                deviceView={deviceView}
                customCss={selectedPage?.customCss || ""}
                customJs={selectedPage?.customJs || ""}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


