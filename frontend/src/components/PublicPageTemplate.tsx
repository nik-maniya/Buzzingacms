import { useEffect, useMemo, useRef, useState } from "react";

interface PublicPageTemplateProps {
  headerContent: string;
  bodyContent: string;
  footerContent: string;
  pageTitle?: string;
  deviceView?: "desktop" | "tablet" | "mobile";
  customCss?: string;
  customJs?: string;
  skipGlobalCss?: boolean; // When true, skip global CSS to prevent conflicts
  cssScopeClass?: string; // Optional class to scope CSS to
  isPreviewMode?: boolean; // When true, enables client-side routing for preview
  onNavigate?: (path: string) => void; // Callback for client-side navigation in preview mode
  availablePages?: Array<{ slug: string; id: string }>; // Available pages for navigation (for preview mode)
}

export function PublicPageTemplate({
  headerContent,
  bodyContent,
  footerContent,
  pageTitle = "Page Title",
  deviceView = "desktop",
  customCss,
  customJs,
  skipGlobalCss = false,
  cssScopeClass,
  isPreviewMode = false,
  onNavigate,
  availablePages = [],
}: PublicPageTemplateProps) {
  const [globalHeaderHtml, setGlobalHeaderHtml] = useState<string>("");
  const [globalFooterHtml, setGlobalFooterHtml] = useState<string>("");
  const [globalHeaderCss, setGlobalHeaderCss] = useState<string>("");
  const [globalFooterCss, setGlobalFooterCss] = useState<string>("");
  const [globalHeaderJs, setGlobalHeaderJs] = useState<string>("");
  const [globalFooterJs, setGlobalFooterJs] = useState<string>("");
  // Render HTML content safely (in production, use DOMPurify)
  const createMarkup = (html: string) => {
    if (!html) return { __html: '' };
    // dangerouslySetInnerHTML expects raw HTML string
    // React will render it as actual HTML elements
    return { __html: html };
  };
  
  // Helper to ensure HTML is properly formatted for rendering
  const ensureHtmlRendering = (html: string): string => {
    if (!html) return '';
    // Check if HTML contains escaped entities (like &lt; instead of <)
    // If it does, decode them. Otherwise, use as-is.
    if (html.includes('&lt;') || html.includes('&gt;') || html.includes('&amp;')) {
      // Content appears to be HTML-escaped, decode it
      const txt = document.createElement('textarea');
      txt.innerHTML = html;
      return txt.value;
    }
    // Content is already raw HTML, use directly
    return html;
  };

  // Load global header/footer from Menus API (applies across all pages)
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (!token) return;

    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://mycms.test:3000";

    fetch(`${apiBase}/api/menus/getAllmenu`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) throw new Error(res?.message || "Failed to load menus");
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!list.length) return;

        // Prefer a menu with explicit header/footer fields; else pick the first
        const menu = list.find((m: any) => m?.header || m?.footer) || list[0];
        const header = menu?.header && typeof menu.header === "object" ? menu.header : null;
        const footer = menu?.footer && typeof menu.footer === "object" ? menu.footer : null;

        if (header) {
          setGlobalHeaderHtml(header.html || header.content || "");
          setGlobalHeaderCss(header.css || "");
          setGlobalHeaderJs(header.js || "");
        }
        if (footer) {
          setGlobalFooterHtml(footer.html || footer.content || "");
          setGlobalFooterCss(footer.css || "");
          setGlobalFooterJs(footer.js || "");
        }
      })
      .catch(() => {
        // no-op; keep defaults
      });
  }, []);

  // Container to mount executable script (dangerouslySetInnerHTML scripts don't execute in React)
  const scriptMountRef = useRef<HTMLDivElement | null>(null);

  // Helper function to scope CSS to a class
  const scopeCss = (css: string, scopeClass: string): string => {
    if (!css || !scopeClass) return css;
    
    // Simple approach: prepend scope class to each CSS rule
    // This handles most common cases
    return css.replace(/([^{}]+)\{/g, (match, selector) => {
      // Skip if already scoped or is a special rule
      if (selector.includes(scopeClass) || selector.trim().startsWith('@')) {
        return match;
      }
      
      // Scope the selector
      const scopedSelector = selector.split(',').map(s => {
        const trimmed = s.trim();
        // Don't double-scope
        if (trimmed.includes(scopeClass)) return trimmed;
        // Handle pseudo-selectors and special cases
        if (trimmed.startsWith(':') || trimmed.startsWith('@')) return trimmed;
        return `${scopeClass} ${trimmed}`;
      }).join(', ');
      
      return `${scopedSelector}{`;
    });
  };

  // Merge page and global CSS/JS for execution and styling
  const mergedCss = useMemo(() => {
    let css = "";
    
    if (skipGlobalCss) {
      // Only use customCss, skip global CSS to prevent conflicts
      css = (customCss || "").trim();
    } else {
      // Merge all CSS
      const parts = [customCss || "", globalHeaderCss, globalFooterCss].filter(Boolean);
      css = parts.join("\n\n");
    }
    
    // Scope CSS if scope class is provided (but don't scope when skipGlobalCss is true to allow CSS to work normally)
    if (cssScopeClass && css && !skipGlobalCss) {
      css = scopeCss(css, cssScopeClass);
    }
    
    return css.trim();
  }, [customCss, globalHeaderCss, globalFooterCss, skipGlobalCss, cssScopeClass]);

  const mergedJs = useMemo(() => {
    const parts = [globalHeaderJs, globalFooterJs, customJs || ""].filter(Boolean);
    return parts.join("\n\n");
  }, [customJs, globalHeaderJs, globalFooterJs]);

  // Inject and execute merged JS by creating a real script element
  useEffect(() => {
    if (!scriptMountRef.current) return;
    
    // Clear previous scripts
    scriptMountRef.current.innerHTML = "";
    
    if (!mergedJs || !mergedJs.trim()) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let retryTimeoutId: NodeJS.Timeout | null = null;
    let cancelled = false;

    // Function to execute the script
    const executeScript = () => {
      if (cancelled || !scriptMountRef.current) return;
      
      try {
        // Wrap user's script to ensure it runs after DOM is ready
        // This handles cases where scripts try to access DOM elements immediately
        const wrappedScript = `
          (function() {
            // Helper to find the scrollable container (for preview mode)
            // In public preview, content is inside a scrollable div, not the window
            function findScrollContainer(element) {
              if (!element) return window;
              let parent = element.parentElement;
              while (parent) {
                const style = window.getComputedStyle(parent);
                if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll') {
                  return parent;
                }
                parent = parent.parentElement;
              }
              return window;
            }
            
            // Override window.scrollTo to work with scrollable containers in preview mode
            const originalScrollTo = window.scrollTo;
            window.scrollTo = function(options) {
              if (typeof options === 'object' && options.top !== undefined) {
                // Try to find scrollable container
                const pageBody = document.querySelector('.cms-page-body');
                if (pageBody) {
                  const scrollContainer = findScrollContainer(pageBody);
                  if (scrollContainer !== window) {
                    // Scroll the container instead of window
                    scrollContainer.scrollTo({
                      top: options.top,
                      left: options.left || 0,
                      behavior: options.behavior || 'auto'
                    });
                    return;
                  }
                }
              }
              // Fallback to original scrollTo
              return originalScrollTo.apply(window, arguments);
            };
            
            // Wait for content to be in DOM and ensure elements are available
            function runScript() {
              try {
                ${mergedJs}
              } catch (error) {
                console.error("Error in custom JavaScript:", error);
              }
            }
            
            // Check if content container exists and has body content
            const container = document.querySelector('.cms-page-body');
            if (container && container.children.length > 0) {
              // Content is ready, but wait one more frame to ensure all elements are rendered
              requestAnimationFrame(() => {
                setTimeout(runScript, 10);
              });
            } else {
              // Wait a bit more for content to render
              setTimeout(() => {
                const retryContainer = document.querySelector('.cms-page-body');
                if (retryContainer && retryContainer.children.length > 0) {
                  requestAnimationFrame(() => {
                    setTimeout(runScript, 10);
                  });
                } else {
                  // Last resort - run anyway after delay
                  setTimeout(runScript, 100);
                }
              }, 50);
            }
          })();
        `;
        
        // Create and append a real script element (this WILL execute)
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.text = wrappedScript;
        scriptMountRef.current.appendChild(script);

        // Dispatch DOMContentLoaded event if document is already loaded
        // This ensures event listeners in user's code will fire
        if (document.readyState !== "loading") {
          try {
            const event = new Event("DOMContentLoaded", { bubbles: true });
            document.dispatchEvent(event);
            // Also dispatch on the container for scoped event listeners
            if (contentContainerRef.current) {
              contentContainerRef.current.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true }));
            }
          } catch (e) {
            // Fallback for older browsers
            const event = document.createEvent("Event");
            event.initEvent("DOMContentLoaded", true, true);
            document.dispatchEvent(event);
            if (contentContainerRef.current) {
              const containerEvent = document.createEvent("Event");
              containerEvent.initEvent("DOMContentLoaded", true, true);
              contentContainerRef.current.dispatchEvent(containerEvent);
            }
          }
        }
      } catch (error) {
        console.error("Error executing custom JavaScript:", error);
      }
    };

    // Wait for body content to be rendered before executing scripts
    // Use requestAnimationFrame + setTimeout to ensure DOM is fully rendered
    const frameId = requestAnimationFrame(() => {
      if (cancelled) return;
      
      // Use setTimeout with a delay to ensure React has finished rendering
      // This is especially important when navigating between pages in preview mode
      timeoutId = setTimeout(() => {
        if (cancelled || !scriptMountRef.current) return;
        
        // Check if content container exists and has content
        // If content not ready, try again after a short delay
        if (contentContainerRef.current) {
          const hasContent = contentContainerRef.current.querySelector('.cms-page-body') !== null;
          if (!hasContent) {
            retryTimeoutId = setTimeout(() => {
              if (!cancelled && scriptMountRef.current) {
                executeScript();
              }
            }, 100);
            return;
          }
        }
        
        // Execute script (even if contentContainerRef is null, script should still execute)
        executeScript();
      }, 100); // Delay to ensure DOM is ready, especially for preview mode
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [mergedJs, bodyContent]); // Also depend on bodyContent to re-run when content changes

  const containerWidth =
    deviceView === "desktop"
      ? "w-full"
      : deviceView === "tablet"
      ? "w-[768px]"
      : "w-[375px]";

  // Scope user CSS to .cms-page-body automatically (not .cms-page to avoid affecting header/footer)
  const scopedCss = useMemo(() => {
    // Split CSS into parts that should affect header/footer vs body
    // Scope all page custom CSS to .cms-page-body to prevent it from affecting header/footer
    // Global header/footer CSS should not be scoped (they're already in their own containers)
    
    let pageCss = customCss || "";
    let globalCss = "";
    
    // Check if customCss contains header/footer CSS markers (for public pages)
    // If so, extract header/footer CSS and keep it unscoped
    if (pageCss.includes("/* Header CSS */") || pageCss.includes("/* Footer CSS */")) {
      const parts = pageCss.split(/\n\s*\n/);
      const headerFooterParts: string[] = [];
      const pageParts: string[] = [];
      
      let currentSection = "";
      for (const part of parts) {
        if (part.includes("/* Header CSS */")) {
          if (currentSection) pageParts.push(currentSection);
          currentSection = part.replace("/* Header CSS */", "").trim();
          headerFooterParts.push(currentSection);
          currentSection = "";
        } else if (part.includes("/* Footer CSS */")) {
          if (currentSection) pageParts.push(currentSection);
          currentSection = part.replace("/* Footer CSS */", "").trim();
          headerFooterParts.push(currentSection);
          currentSection = "";
        } else {
          currentSection += (currentSection ? "\n\n" : "") + part;
        }
      }
      if (currentSection) pageParts.push(currentSection);
      
      // Header/footer CSS should be global (unscoped)
      globalCss = headerFooterParts.join("\n\n");
      // Page CSS should be scoped
      pageCss = pageParts.join("\n\n");
    } else {
      // No markers found, treat all as page CSS (will be scoped)
      // But also include global header/footer CSS if available
      if (!skipGlobalCss) {
        const parts = [globalHeaderCss, globalFooterCss].filter(Boolean);
        globalCss = parts.join("\n\n");
      }
    }
    
    // Scope page CSS to .cms-page-body
    let scopedPageCss = "";
    if (pageCss.trim()) {
      scopedPageCss = scopeCss(pageCss, ".cms-page-body");
    }
    
    // Combine: global CSS (unscoped) + scoped page CSS
    const result = [globalCss, scopedPageCss].filter(Boolean).join("\n\n").trim();
    return result;
  }, [customCss, globalHeaderCss, globalFooterCss, skipGlobalCss]);

  // Container ref for intercepting link clicks in preview mode
  const contentContainerRef = useRef<HTMLDivElement | null>(null);

  // Intercept link clicks for client-side routing in preview mode
  useEffect(() => {
    if (!isPreviewMode || !onNavigate || !contentContainerRef.current) return;

    const container = contentContainerRef.current;
    
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      
      if (!anchor) return;
      
      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip if it's an external link (http/https), mailto, tel, or anchor link
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        anchor.hasAttribute('target') && anchor.getAttribute('target') === '_blank'
      ) {
        // Allow external links to work normally
        return;
      }

      // Check if this is a link to an available page (if availablePages provided)
      // Otherwise, treat all relative paths as internal links
      const normalizedHref = href.startsWith('/') ? href : `/${href}`;
      const matchingPage = availablePages.length > 0 
        ? availablePages.find((p) => p.slug === normalizedHref || p.slug === href || p.id === href)
        : null;

      // If availablePages is empty, treat all relative paths as internal links
      if (matchingPage || href.startsWith('/') || (availablePages.length === 0 && !href.startsWith('http'))) {
        // This is an internal link - prevent default and use client-side routing
        e.preventDefault();
        e.stopPropagation();
        
        // Extract the path (remove query params and hash)
        // Handle both absolute and relative paths
        let path = href;
        try {
          // Try to parse as URL (works for absolute paths)
          const url = new URL(href, window.location.origin);
          path = url.pathname;
        } catch {
          // If parsing fails, it's likely a relative path - use as-is
          // Remove query params and hash manually
          const queryIndex = path.indexOf('?');
          const hashIndex = path.indexOf('#');
          if (queryIndex !== -1) {
            path = path.substring(0, queryIndex);
          } else if (hashIndex !== -1) {
            path = path.substring(0, hashIndex);
          }
        }
        
        // Call the navigation handler
        onNavigate(path);
      }
    };

    // Use event delegation on the container
    container.addEventListener('click', handleLinkClick, true);

    return () => {
      container.removeEventListener('click', handleLinkClick, true);
    };
  }, [isPreviewMode, onNavigate, availablePages]);

  return (
    <div className={`${containerWidth} mx-auto bg-white min-h-screen flex flex-col`} style={{ minHeight: "calc(100dvh - 371px)" }}>
      {/* User's custom CSS - page CSS scoped to .cms-page-body, global CSS unscoped */}
      {scopedCss ? (
        <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      ) : null}
      
      {/* Automatically wrap all user content in .cms-page */}  
      <div className="cms-page" ref={contentContainerRef}>
        {/* Header Section */}
        {(globalHeaderHtml || headerContent) ? (
          <div
            style={{ maxWidth: "100%", overflow: "hidden" }}
            dangerouslySetInnerHTML={createMarkup(globalHeaderHtml || headerContent)}
          />
        ) : null}

        {/* Body Section */}
        <main className="flex-1 w-full cms-page-body">
          {bodyContent ? (
            <div
              className={skipGlobalCss ? "" : "prose prose-neutral max-w-none [&_a]:text-blue-600 [&_a:hover]:text-blue-700 [&_img]:rounded-lg [&_img]:shadow-md [&_p]:leading-relaxed"}
              dangerouslySetInnerHTML={{ __html: ensureHtmlRendering(bodyContent) }}
            />
          ) : (
            <div className="text-neutral-400 text-center py-12">
              No page content
            </div>
          )}
        </main>

        {/* Footer Section */}
        {(globalFooterHtml || footerContent) ? (
          <div
            dangerouslySetInnerHTML={createMarkup(globalFooterHtml || footerContent)}
          />
        ) : null}
        
        {/* Script mount point - custom JS will be injected here and executed */}
        <div ref={scriptMountRef} />
      </div>
    </div>
  );
}