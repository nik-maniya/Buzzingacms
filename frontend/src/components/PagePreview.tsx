import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Monitor, Tablet, Smartphone, ExternalLink, X, ArrowLeft } from "lucide-react";
import { PublicPageTemplate } from "./PublicPageTemplate";
import { cn } from "./ui/utils";

interface PagePreviewProps {
  open: boolean;
  onClose: () => void;
  pageTitle: string;
  pageBody: string;
  headerContent?: string;
  footerContent?: string;
  customCss?: string;
  customJs?: string;
  selectedCollectionFilters?: string[];
  collections?: any[];
}

export function PagePreview({
  open,
  onClose,
  pageTitle,
  pageBody,
  headerContent = "",
  footerContent = "",
  customCss = "",
  customJs = "",
  selectedCollectionFilters = [],
  collections = [],
}: PagePreviewProps) {
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );

  // State for inline item detail
  const [itemDetailData, setItemDetailData] = useState<{
    htmlContent: string;
    customCss: string;
    customJs: string;
  } | null>(null);
  const [loadingItemDetail, setLoadingItemDetail] = useState(false);
  const [viewingItemDetail, setViewingItemDetail] = useState(false);
  const eventHandledRef = useRef<{ collectionId: number; itemId: number; time: number } | null>(null);

  const apiBase = (import.meta as any).env?.VITE_API_URL
    ? (import.meta as any).env.VITE_API_URL
    : "http://localhost:5000";

  // Function to open item detail inline
  const openItemDetail = async (collectionId: number, itemId: number) => {
    // Prevent duplicate opens
    if (viewingItemDetail || loadingItemDetail) return;
    
    // Debounce: prevent rapid duplicate calls
    const now = Date.now();
    if (eventHandledRef.current) {
      const { collectionId: prevCollectionId, itemId: prevItemId, time } = eventHandledRef.current;
      if (prevCollectionId === collectionId && prevItemId === itemId && (now - time) < 500) {
        console.log('PagePreview: Ignoring duplicate event', { collectionId, itemId });
        return;
      }
    }
    
    eventHandledRef.current = { collectionId, itemId, time: now };
    
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (!token) return;

    setLoadingItemDetail(true);
    setViewingItemDetail(true);

    try {
      const response = await fetch(
        `${apiBase}/api/page-templates/renderItem/${collectionId}/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const res = await response.json();
      if (response.ok && res?.data) {
        setItemDetailData({
          htmlContent: res.data.htmlContent || '',
          customCss: res.data.customCss || '',
          customJs: res.data.customJs || '',
        });
      } else {
        console.error('Failed to load item detail:', res?.message || 'Unknown error');
        setViewingItemDetail(false);
      }
    } catch (error) {
      console.error('Error loading item detail:', error);
      setViewingItemDetail(false);
    } finally {
      setLoadingItemDetail(false);
    }
  };

  // Function to go back to page view
  const goBackToPage = () => {
    setViewingItemDetail(false);
    setItemDetailData(null);
    eventHandledRef.current = null;
  };

  // Reset item detail view when preview dialog closes
  useEffect(() => {
    if (!open) {
      setViewingItemDetail(false);
      setItemDetailData(null);
      setLoadingItemDetail(false);
      eventHandledRef.current = null;
    }
  }, [open]);

  // Listen for custom events to open item detail (fallback for inline onclick handlers)
  useEffect(() => {
    if (!open) return;
    
    const handleCustomEvent = async (event: CustomEvent) => {
      console.log('PagePreview: Received custom event:', event.detail);
      if (event.detail?.collectionId && event.detail?.itemId) {
        await openItemDetail(event.detail.collectionId, event.detail.itemId);
      }
    };
    
    window.addEventListener('openItemDetail', handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener('openItemDetail', handleCustomEvent as EventListener);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const devices = [
    { id: "desktop" as const, label: "Desktop", icon: Monitor },
    { id: "tablet" as const, label: "Tablet", icon: Tablet },
    { id: "mobile" as const, label: "Mobile", icon: Smartphone },
  ];

  // Attach click handlers to collection items using event delegation
  useEffect(() => {
    if (!open || viewingItemDetail || loadingItemDetail) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Find the closest element with data attributes (could be the clicked element or a parent)
      const clickableElement = target.closest('[data-collection-id][data-item-id]') as HTMLElement;
      
      if (clickableElement) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const collectionId = parseInt(clickableElement.dataset.collectionId || '0');
        const itemId = parseInt(clickableElement.dataset.itemId || '0');
        if (collectionId && itemId) {
          console.log('PagePreview: Opening item detail directly', { collectionId, itemId });
          // Call openItemDetail directly instead of dispatching event
          openItemDetail(collectionId, itemId);
        }
      }
    };

    // Use event delegation on the document body or a container
    // This works even if elements are added dynamically
    document.addEventListener('click', handleClick, true); // Use capture phase

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [open, pageBody, viewingItemDetail, loadingItemDetail]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none p-0 gap-0 border-0 rounded-none inset-0 translate-x-0 translate-y-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Page Preview</DialogTitle>
        <DialogDescription className="sr-only">
          Preview of how {pageTitle} will appear on the public website with header, body, and footer sections
        </DialogDescription>
        
        {/* Full Width Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-white shrink-0">
          <div className="flex items-center gap-4">
            {viewingItemDetail && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBackToPage}
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="h-6 w-px bg-neutral-200" />
              </>
            )}
            <div>
              <h3 className="text-neutral-900">{viewingItemDetail ? "Item Detail" : "Page Preview"}</h3>
              <p className="text-sm text-neutral-500">
                {viewingItemDetail ? "Collection item preview" : pageTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!viewingItemDetail && (
              <>
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
              </>
            )}

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
            <div className="flex-1 overflow-auto preview-scrollbar">
              <style>{`
                .preview-scrollbar::-webkit-scrollbar {
                  width: 10px;
                  height: 10px;
                }
                .preview-scrollbar::-webkit-scrollbar-track {
                  background: #f5f5f5;
                  border-radius: 5px;
                }
                .preview-scrollbar::-webkit-scrollbar-thumb {
                  background: #d4d4d4;
                  border-radius: 5px;
                }
                .preview-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #a3a3a3;
                }
                .preview-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: #d4d4d4 #f5f5f5;
                }
              `}</style>
              {viewingItemDetail ? (
                loadingItemDetail ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-neutral-500">Loading item detail...</p>
                  </div>
                ) : itemDetailData ? (
                  <PublicPageTemplate
                    headerContent=""
                    bodyContent={itemDetailData.htmlContent}
                    footerContent=""
                    pageTitle="Item Detail"
                    deviceView={deviceView}
                    customCss={itemDetailData.customCss}
                    customJs={itemDetailData.customJs}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-neutral-500">No item data available</p>
                  </div>
                )
              ) : pageBody ? (
                <PublicPageTemplate
                  headerContent={headerContent}
                  bodyContent={pageBody}
                  footerContent={footerContent}
                  pageTitle={pageTitle}
                  deviceView={deviceView}
                  customCss={customCss}
                  customJs={customJs}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-neutral-500">No content to display</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}