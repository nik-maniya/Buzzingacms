import { useState, useEffect, useRef, useMemo } from "react";
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
  customCss?: string;
  customJs?: string;
  selectedCollectionFilters?: string[];
  collections?: any[];
  pageSlug?: string; // Optional page slug for "Open in New Tab" functionality
  availablePages?: Array<{ slug: string; id: string }>; // Available pages for client-side routing
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
  pageSlug,
  availablePages = [],
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
    : "http://mycms.test:3000";

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

  // Process page body to inject item detail inline when viewing item detail
  const processedPageBody = useMemo(() => {
    let content = pageBody || '';
    
    // If viewing item detail, inject it into the content while keeping the page structure
    if (viewingItemDetail && itemDetailData) {
      // Insert item detail at the beginning of the body content
      const itemDetailHtml = itemDetailData.htmlContent || '';
      // Wrap item detail in a container with a back button
      const backButton = '<div style="margin-bottom: 2rem;"><button data-back-to-list="true" style="padding: 0.5rem 1rem; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 1rem;">← Back to List</button></div>';
      content = backButton + itemDetailHtml;
    }
    
    return content;
  }, [pageBody, viewingItemDetail, itemDetailData]);

  // Listen for custom events to open item detail (fallback for inline onclick handlers)
  useEffect(() => {
    if (!open) return;
    
    const handleCustomEvent = async (event: CustomEvent) => {
      console.log('PagePreview: Received custom event:', event.detail);
      if (event.detail?.collectionId && event.detail?.itemId) {
        await openItemDetail(event.detail.collectionId, event.detail.itemId);
      }
    };
    
    // Listen for close item detail event
    const handleCloseItemDetail = () => {
      goBackToPage();
    };
    
    window.addEventListener('openItemDetail', handleCustomEvent as EventListener);
    window.addEventListener('closeItemDetail', handleCloseItemDetail as EventListener);
    
    return () => {
      window.removeEventListener('openItemDetail', handleCustomEvent as EventListener);
      window.removeEventListener('closeItemDetail', handleCloseItemDetail as EventListener);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const devices = [
    { id: "desktop" as const, label: "Desktop", icon: Monitor },
    { id: "tablet" as const, label: "Tablet", icon: Tablet },
    { id: "mobile" as const, label: "Mobile", icon: Smartphone },
  ];

  // Attach click handlers to collection items and back button using event delegation
  useEffect(() => {
    if (!open) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if back button was clicked
      const backButton = target.closest('[data-back-to-list]') as HTMLElement;
      if (backButton) {
        e.preventDefault();
        e.stopPropagation();
        goBackToPage();
        return;
      }
      
      // Only handle item clicks if not viewing item detail
      if (viewingItemDetail || loadingItemDetail) return;
      
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
            <div>
              <h3 className="text-neutral-900">Page Preview</h3>
              <p className="text-sm text-neutral-500">
                {pageTitle}
              </p>
            </div>
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
                // Get frontend URL from env or use default
                const frontendUrl = (import.meta as any).env?.VITE_FRONTEND_URL 
                  ? (import.meta as any).env.VITE_FRONTEND_URL 
                  : window.location.origin.includes('localhost') 
                    ? 'http://localhost:3000' 
                    : window.location.origin;
                
                // Build the full URL with page slug
                const slug = pageSlug 
                  ? (pageSlug.startsWith("/") ? pageSlug : `/${pageSlug}`)
                  : "/";
                
                const fullUrl = `${frontendUrl}${slug}`;
                window.open(fullUrl, "_blank");
              }}
              disabled={!pageSlug}
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
              {loadingItemDetail ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-neutral-500">Loading item detail...</p>
                </div>
              ) : processedPageBody ? (
                <PublicPageTemplate
                  headerContent={headerContent}
                  bodyContent={processedPageBody}
                  footerContent={footerContent}
                  pageTitle={pageTitle}
                  deviceView={deviceView}
                  customCss={viewingItemDetail && itemDetailData?.customCss 
                    ? `${customCss}\n${itemDetailData.customCss}` 
                    : customCss}
                  customJs={viewingItemDetail && itemDetailData?.customJs
                    ? `${customJs}\n${itemDetailData.customJs}`
                    : customJs}
                  isPreviewMode={availablePages.length > 0}
                  onNavigate={availablePages.length > 0 ? (path) => {
                    // In PagePreview, we can't navigate to other pages since we only have one page
                    // But we can still intercept links to prevent full page reloads
                    // For now, we'll just log it - in a real scenario, you might want to show a message
                    console.log('Navigation requested in preview:', path);
                  } : undefined}
                  availablePages={availablePages}
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