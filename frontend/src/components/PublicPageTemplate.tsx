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
      : "http://localhost:5000";

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
    
    if (!mergedJs) return;

    // Create and append a real script element (this WILL execute)
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.text = mergedJs;
    scriptMountRef.current.appendChild(script);

    // Dispatch DOMContentLoaded event if document is already loaded
    // This ensures event listeners in user's code will fire
    if (document.readyState !== "loading") {
      try {
        const event = new Event("DOMContentLoaded", { bubbles: true });
        document.dispatchEvent(event);
      } catch (e) {
        // Fallback for older browsers
        const event = document.createEvent("Event");
        event.initEvent("DOMContentLoaded", true, true);
        document.dispatchEvent(event);
      }
    }
  }, [mergedJs]);

  const containerWidth =
    deviceView === "desktop"
      ? "w-full"
      : deviceView === "tablet"
      ? "w-[768px]"
      : "w-[375px]";

  return (
    <div className={`${containerWidth} mx-auto bg-white min-h-screen flex flex-col`}>
      {/* Custom CSS for preview/published rendering */}
      {skipGlobalCss && mergedCss ? (
        <>
          {/* Reset any potential conflicts from parent styles */}
          <style dangerouslySetInnerHTML={{ __html: `
            /* Reset conflicting styles when viewing item details */
            .item-detail-isolated * {
              box-sizing: border-box;
            }
          ` }} />
          {/* Item's custom CSS with higher specificity */}
          <style dangerouslySetInnerHTML={{ __html: mergedCss }} />
        </>
      ) : mergedCss ? (
        <style dangerouslySetInnerHTML={{ __html: mergedCss }} />
      ) : null}
      {/* Header Section (no static styling) */}
      {!skipGlobalCss && (globalHeaderHtml || headerContent) ? (
        <div
          dangerouslySetInnerHTML={createMarkup(globalHeaderHtml || headerContent)}
        />
      ) : null}
      {skipGlobalCss && headerContent ? (
        <div
          dangerouslySetInnerHTML={createMarkup(headerContent)}
        />
      ) : null}

      {/* Body Section */}
      <main className="flex-1 w-full">
        <article className="max-w-[900px] mx-auto px-6 py-12">
          {/* Page Body Content */}
          {bodyContent ? (
            <div
              className={skipGlobalCss ? "" : "prose prose-neutral max-w-none [&_a]:text-blue-600 [&_a:hover]:text-blue-700 [&_img]:rounded-lg [&_img]:shadow-md [&_h1]:text-neutral-900 [&_h2]:text-neutral-900 [&_h3]:text-neutral-800 [&_p]:text-neutral-700 [&_p]:leading-relaxed"}
              dangerouslySetInnerHTML={{ __html: ensureHtmlRendering(bodyContent) }}
            />
          ) : (
            <div className="text-neutral-400 text-center py-12">
              No page content
            </div>
          )}
        </article>
      </main>

      {/* Footer Section (no static styling) */}
      {!skipGlobalCss && (globalFooterHtml || footerContent) ? (
        <div
          dangerouslySetInnerHTML={createMarkup(globalFooterHtml || footerContent)}
        />
      ) : null}
      {skipGlobalCss && footerContent ? (
        <div
          dangerouslySetInnerHTML={createMarkup(footerContent)}
        />
      ) : null}
      
      {/* Script mount point - custom JS will be injected here and executed */}
      <div ref={scriptMountRef} />
    </div>
  );
}
