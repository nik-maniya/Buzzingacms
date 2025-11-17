import { useState, useEffect, useMemo } from "react";
import { PublicPageTemplate } from "./PublicPageTemplate";
import { Button } from "./ui/button";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "./ui/utils";

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | string;
  isHomePage?: boolean;
  contentHtml: string;
  customCss?: string;
  customJs?: string;
}

export function PublicPageDemo() {
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [itemDetailData, setItemDetailData] = useState<{
    htmlContent: string;
    customCss: string;
    customJs: string;
  } | null>(null);
  const [loadingItemDetail, setLoadingItemDetail] = useState(false);
  const [viewingItemDetail, setViewingItemDetail] = useState(false);

  // Use relative URL so domain is automatically included
  const apiBase = (import.meta as any).env?.VITE_API_URL
    ? (import.meta as any).env.VITE_API_URL
    : "/api";

  // Function to open item detail inline
  const openItemDetail = async (collectionId: number, itemId: number) => {
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (!token) return;

    setLoadingItemDetail(true);
    setViewingItemDetail(true);

    try {
      const response = await fetch(
        `${apiBase}/page-templates/renderItem/${collectionId}/${itemId}`,
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
  };

  // Listen for custom events to open item detail
  useEffect(() => {
    const handleCustomEvent = async (event: CustomEvent) => {
      console.log('PublicPageDemo: Received custom event:', event.detail);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch collections for placeholder processing
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (!token) {
      setCollections([]);
      return;
    }

    fetch(`${apiBase}/collections/with-items`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) throw new Error(res?.message || "Failed to load collections");
        const list = Array.isArray(res?.data) ? res.data : [];
        setCollections(list);
      })
      .catch(() => {
        setCollections([]);
      });
  }, [apiBase]);

  // Fetch all pages
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setPages([]);
      return;
    }
    setLoading(true);
    fetch(`${apiBase}/pages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) throw new Error(res?.message || "Failed to load pages");
        const list = Array.isArray(res?.data) ? res.data : [];
        const mapped: PageItem[] = list.map((p: any) => {
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
  }, [apiBase]);

  // Function to replace field placeholders in item template
  const replaceFieldPlaceholders = (template: string, itemData: any, fields: any[]): string => {
    let processed = template;
    
    fields.forEach((field: any) => {
      const fieldLabel = field.fieldLabel || '';
      const possibleKeys = [
        fieldLabel,
        fieldLabel.toLowerCase().replace(/\s+/g, '_'),
        fieldLabel.toLowerCase().replace(/\s+/g, '-'),
        fieldLabel.toLowerCase(),
        String(field.id)
      ];
      
      let fieldValue = null;
      for (const key of possibleKeys) {
        if (itemData[key] !== undefined && itemData[key] !== null && itemData[key] !== '') {
          fieldValue = itemData[key];
          break;
        }
      }
      
      if (fieldValue !== null) {
        const placeholderVariations = [
          fieldLabel,
          fieldLabel.toLowerCase().replace(/\s+/g, '_'),
          fieldLabel.toLowerCase().replace(/\s+/g, '-'),
          fieldLabel.toLowerCase(),
        ];
        
        placeholderVariations.forEach(placeholder => {
          const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\{\\{${escaped}\\}\\}`, 'gi');
          processed = processed.replace(regex, String(fieldValue));
        });
      }
    });
    
    Object.keys(itemData).forEach((key) => {
      const value = itemData[key];
      if (value !== null && value !== undefined && value !== '') {
        const keyVariations = [
          key,
          key.toLowerCase().replace(/\s+/g, '_'),
          key.toLowerCase().replace(/\s+/g, '-'),
          key.toLowerCase(),
        ];
        
        keyVariations.forEach(keyVar => {
          const escaped = keyVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\{\\{${keyVar}\\}\\}`, 'gi');
          processed = processed.replace(regex, String(value));
        });
      }
    });
    
    return processed;
  };

  // Function to replace collection placeholders
  const replaceCollectionPlaceholders = useMemo(() => {
    return (html: string): string => {
      if (!html) return html;
      if (collections.length === 0) return html;
      
      let processedHtml = html;
      
      const collectionPattern = /\{\{collection:([^}]+)\}\}/g;
      const collectionMatches = Array.from(html.matchAll(collectionPattern));
      
      if (collectionMatches.length > 0) {
        const matchesArray = Array.from(collectionMatches).reverse();
        
        matchesArray.forEach((match) => {
          const fullMatch = match[0];
          const slug = match[1].trim();
          const collection = collections.find((c) => c.slug === slug);
          
          if (!collection || !collection.items || collection.items.length === 0) {
            processedHtml = processedHtml.replace(fullMatch, `<div style="padding: 1rem; background: #f5f5f5; border-radius: 4px; margin: 1rem 0;">
              <p style="color: #666; margin: 0;">Collection "${slug}" not found or has no published items.</p>
            </div>`);
            return;
          }

          const items = collection.items;
          const fields = collection.fields || [];
          
          const placeholderIndex = processedHtml.indexOf(fullMatch);
          if (placeholderIndex === -1) return;
          
          const beforePlaceholder = processedHtml.substring(0, placeholderIndex);
          const afterPlaceholder = processedHtml.substring(placeholderIndex + fullMatch.length);
          
          let template = '';
          const nextCollectionPattern = /\{\{collection:([^}]+)\}\}/;
          const nextMatch = afterPlaceholder.match(nextCollectionPattern);
          
          if (nextMatch && nextMatch.index !== undefined) {
            template = afterPlaceholder.substring(0, nextMatch.index).trim();
          } else {
            template = afterPlaceholder.trim();
          }
          
          if (!template || template.length === 0) {
            template = `
              <div class="collection-item" style="margin-bottom: 2rem; padding: 1.5rem; border: 1px solid #e5e5e5; border-radius: 8px;">
                <h2>{{title}}</h2>
                <p>{{description}}</p>
              </div>
            `;
          }
          
          const itemsHtml = items
            .map((item: any, index: number) => {
              const itemData = item.data || {};
              
              const enhancedItemData = {
                ...itemData,
                _itemId: item.id,
                _itemIndex: index,
                _itemNumber: index + 1,
                _totalItems: items.length,
                slug: itemData.slug || itemData.Slug || itemData.SLUG || '',
              };
              
              let itemHtml = replaceFieldPlaceholders(template, enhancedItemData, fields);
              
              // Make titles (h1-h6) and links (a) clickable to show item detail
              const collectionId = collection.id;
              const itemId = item.id;
              
              // First, make headings clickable
              itemHtml = itemHtml.replace(
                /<(h[1-6])([^>]*)>(.*?)<\/\1>/gi,
                (match, tag, attrs, content) => {
                  // Check if already has onclick or data attributes
                  if (attrs.includes('onclick') || attrs.includes('data-collection-id')) return match;
                  // Add data attributes and onclick
                  const safeOnclick = `(function(){try{window.dispatchEvent(new CustomEvent('openItemDetail',{detail:{collectionId:${collectionId},itemId:${itemId}}}));}catch(e){console.error(e);}})();`;
                  return `<${tag}${attrs} data-collection-id="${collectionId}" data-item-id="${itemId}" onclick="${safeOnclick}" style="cursor: pointer; text-decoration: underline;">${content}</${tag}>`;
                }
              );
              
              // Also make links clickable (in case blog items are rendered as links)
              itemHtml = itemHtml.replace(
                /<a([^>]*)>(.*?)<\/a>/gi,
                (match, attrs, content) => {
                  // Check if already has onclick or data attributes, or if it's an external link
                  if (attrs.includes('onclick') || attrs.includes('data-collection-id') || attrs.includes('href="http')) return match;
                  // Add data attributes and onclick
                  const safeOnclick = `event.preventDefault();event.stopPropagation();try{window.dispatchEvent(new CustomEvent('openItemDetail',{detail:{collectionId:${collectionId},itemId:${itemId}}}));}catch(err){console.error(err);}return false;`;
                  return `<a${attrs} data-collection-id="${collectionId}" data-item-id="${itemId}" onclick="${safeOnclick}" style="cursor: pointer;">${content}</a>`;
                }
              );
              
              // Add item-specific classes and data attributes
              itemHtml = itemHtml.replace(
                /<(\w+)([^>]*)>/g,
                (match, tag, attrs) => {
                  if (!attrs.includes('data-item-id')) {
                    return `<${tag}${attrs} data-item-id="${item.id}" data-item-index="${index}" data-item-slug="${enhancedItemData.slug}">`;
                  }
                  return match;
                }
              );
              
              return itemHtml;
            })
            .join('\n');
          
          const remainingContent = nextMatch && nextMatch.index !== undefined 
            ? afterPlaceholder.substring(nextMatch.index) 
            : '';
          processedHtml = beforePlaceholder + itemsHtml + remainingContent;
        });
      }
      
      return processedHtml;
    };
  }, [collections]);

  const selectedPage = useMemo(() => {
    const normalized = (selectedSlug || "").replace(/^\//, "");
    return (
      pages.find((p) => p.slug.replace(/^\//, "") === normalized) ||
      pages.find((p) => p.id === selectedId)
    );
  }, [pages, selectedSlug, selectedId]);

  // Process the selected page's content
  const processedContent = useMemo(() => {
    if (!selectedPage?.contentHtml) return "";
    let content = replaceCollectionPlaceholders(selectedPage.contentHtml);
    
    // If viewing item detail, inject it into the content while keeping the page structure
    if (viewingItemDetail && itemDetailData) {
      // Insert item detail at the beginning of the body content
      const itemDetailHtml = itemDetailData.htmlContent || '';
      // Wrap item detail in a container with a back button
      const backButton = '<div style="margin-bottom: 2rem;"><button data-back-to-list="true" style="padding: 0.5rem 1rem; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 1rem;">← Back to List</button></div>';
      content = backButton + itemDetailHtml;
    }
    
    return content;
  }, [selectedPage?.contentHtml, replaceCollectionPlaceholders, viewingItemDetail, itemDetailData]);

  // Handle navigation between pages
  const handleNavigate = (path: string) => {
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    const matchingPage = pages.find(
      (p) => p.slug.replace(/^\//, "") === normalizedPath || p.id === normalizedPath
    );
    if (matchingPage) {
      setSelectedSlug(matchingPage.slug.replace(/^\//, ""));
      setSelectedId(matchingPage.id);
      // Reset item detail view when navigating to a new page
      setViewingItemDetail(false);
      setItemDetailData(null);
    }
  };

  // Attach click handlers to collection items and back button using event delegation
  useEffect(() => {
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
          console.log('PublicPageDemo: Opening item detail directly', { collectionId, itemId });
          // Call openItemDetail directly
          openItemDetail(collectionId, itemId);
        }
      }
    };

    // Use event delegation on the document body
    // This works even if elements are added dynamically
    document.addEventListener('click', handleClick, true); // Use capture phase

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [viewingItemDetail, loadingItemDetail]); // eslint-disable-line react-hooks/exhaustive-deps

  const devices = [
    { id: "desktop" as const, label: "Desktop", icon: Monitor },
    { id: "tablet" as const, label: "Tablet", icon: Tablet },
    { id: "mobile" as const, label: "Mobile", icon: Smartphone },
  ];

  // Get available pages for navigation
  const availablePages = useMemo(() => {
    return pages.map((p) => ({
      slug: p.slug.startsWith("/") ? p.slug : `/${p.slug}`,
      id: p.id,
    }));
  }, [pages]);

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-neutral-900">Public Page Preview</h2>
              <p className="text-sm text-neutral-500 mt-1">
                {loading ? "Loading pages..." : selectedPage ? `Viewing: ${selectedPage.title}` : "No pages available"}
              </p>
            </div>

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
                    <span>{device.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-neutral-50 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-500">Loading pages...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-500">No pages found. Create a page to see it here.</p>
          </div>
        ) : !selectedPage ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-500">Select a page to preview</p>
          </div>
        ) : (
        <div className="flex justify-center">
          <div
            className={cn(
              "bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300",
              deviceView === "desktop" && "w-full max-w-[1440px]",
              deviceView === "tablet" && "w-[768px]",
              deviceView === "mobile" && "w-[375px]"
            )}
          >
            {/* Browser Chrome */}
            <div className="h-10 bg-neutral-100 border-b border-neutral-200 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-6 bg-white rounded border border-neutral-200 px-3 flex items-center">
                  <span className="text-xs text-neutral-400">
                      {selectedPage.slug ? `https://yoursite.com${selectedPage.slug.startsWith("/") ? selectedPage.slug : `/${selectedPage.slug}`}` : "https://yoursite.com"}
                  </span>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
                {loadingItemDetail ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-neutral-500">Loading item detail...</p>
                  </div>
                ) : (
              <PublicPageTemplate
                    headerContent=""
                    bodyContent={processedContent}
                    footerContent=""
                    pageTitle={selectedPage.title}
                deviceView={deviceView}
                    customCss={viewingItemDetail && itemDetailData?.customCss 
                      ? `${selectedPage.customCss || ""}\n${itemDetailData.customCss}` 
                      : selectedPage.customCss}
                    customJs={viewingItemDetail && itemDetailData?.customJs
                      ? `${selectedPage.customJs || ""}\n${itemDetailData.customJs}`
                      : selectedPage.customJs || ""}
                    isPreviewMode={true}
                    onNavigate={handleNavigate}
                    availablePages={availablePages}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Navigation
        {pages.length > 0 && (
          <div className="max-w-[1440px] mx-auto mt-8">
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-neutral-900 mb-3">All Pages</h3>
              <div className="flex flex-wrap gap-2">
                {pages.map((page) => {
                  const isSelected = selectedPage && (
                    page.slug.replace(/^\//, "") === selectedPage.slug.replace(/^\//, "") ||
                    page.id === selectedPage.id
                  );
                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        setSelectedSlug(page.slug.replace(/^\//, ""));
                        setSelectedId(page.id);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm transition-all",
                        isSelected
                          ? "bg-amber-500 text-white font-medium"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      )}
                    >
                      {page.title}
                      {page.isHomePage && (
                        <span className="ml-1 text-xs opacity-75">(Home)</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
        )} */}

        {/* Info Cards */}
        <div className="max-w-[1440px] mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm text-neutral-900 mb-1">Header Section</h3>
            <p className="text-xs text-neutral-500">
              Global content from Menus → Header. Appears on all published pages.
            </p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm text-neutral-900 mb-1">Body Section</h3>
            <p className="text-xs text-neutral-500">
              Unique content from each page's editor. Max width 900px, centered.
            </p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm text-neutral-900 mb-1">Footer Section</h3>
            <p className="text-xs text-neutral-500">
              Global content from Menus → Footer. Appears on all published pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
