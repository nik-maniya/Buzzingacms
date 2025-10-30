import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Monitor, Tablet, Smartphone, ExternalLink, X } from "lucide-react";
import { PublicPageTemplate } from "./PublicPageTemplate";
import { cn } from "./ui/utils";

interface PagePreviewProps {
  open: boolean;
  onClose: () => void;
  pageTitle: string;
  pageBody: string;
  headerContent?: string;
  footerContent?: string;
}

export function PagePreview({
  open,
  onClose,
  pageTitle,
  pageBody,
  headerContent = "",
  footerContent = "",
}: PagePreviewProps) {
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );

  const devices = [
    { id: "desktop" as const, label: "Desktop", icon: Monitor },
    { id: "tablet" as const, label: "Tablet", icon: Tablet },
    { id: "mobile" as const, label: "Mobile", icon: Smartphone },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none p-0 gap-0 border-0 rounded-none inset-0 translate-x-0 translate-y-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Page Preview</DialogTitle>
        <DialogDescription className="sr-only">
          Preview of how {pageTitle} will appear on the public website with header, body, and footer sections
        </DialogDescription>
        
        {/* Full Width Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-white shrink-0">
          <div>
            <h3 className="text-neutral-900">Page Preview</h3>
            <p className="text-sm text-neutral-500">{pageTitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Switcher */}
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

            {/* Open in New Tab */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                // In production, this would open the actual public URL
                window.open("/preview/page-slug?token=demo", "_blank");
              }}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </Button>

            {/* Close Button */}
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

        {/* Full Screen Preview Content */}
        <div className="flex-1 overflow-hidden bg-neutral-50 flex items-center justify-center">
          <div
            className={cn(
              "h-full bg-white transition-all duration-300 overflow-hidden flex flex-col",
              deviceView === "desktop" && "w-full",
              deviceView === "tablet" && "w-[768px] shadow-2xl",
              deviceView === "mobile" && "w-[375px] shadow-2xl"
            )}
          >
            {/* Page Content - Full Height */}
            <div className="flex-1 overflow-auto">
              <PublicPageTemplate
                headerContent={headerContent}
                bodyContent={pageBody}
                footerContent={footerContent}
                pageTitle={pageTitle}
                deviceView={deviceView}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
