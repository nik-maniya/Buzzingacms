import { useEffect, useMemo, useRef, useState } from "react";

interface PublicPageTemplateProps {
  headerContent: string;
  bodyContent: string;
  footerContent: string;
  pageTitle?: string;
  deviceView?: "desktop" | "tablet" | "mobile";
  customCss?: string;
  customJs?: string;
}

export function PublicPageTemplate({
  headerContent,
  bodyContent,
  footerContent,
  pageTitle = "Page Title",
  deviceView = "desktop",
  customCss,
  customJs,
}: PublicPageTemplateProps) {
  const [globalHeaderHtml, setGlobalHeaderHtml] = useState<string>("");
  const [globalFooterHtml, setGlobalFooterHtml] = useState<string>("");
  const [globalHeaderCss, setGlobalHeaderCss] = useState<string>("");
  const [globalFooterCss, setGlobalFooterCss] = useState<string>("");
  const [globalHeaderJs, setGlobalHeaderJs] = useState<string>("");
  const [globalFooterJs, setGlobalFooterJs] = useState<string>("");
  
  // Decode HTML entities if needed
  const decodeHtmlEntities = (html: string): string => {
    if (!html) return '';
    
    // Check if content is HTML-encoded
    if (html.includes('&lt;') || html.includes('&gt;') || html.includes('&amp;')) {
      const txt = document.createElement('textarea');
      txt.innerHTML = html;
      return txt.value;
    }
    
    return html;
  };
  
  // Render HTML content safely
  const createMarkup = (html: string) => {
    if (!html) return { __html: '' };
    
    // Decode HTML entities first
    const decodedHtml = decodeHtmlEntities(html);
    
    return { __html: decodedHtml };
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

  // Merge page and global CSS/JS for execution and styling
  const mergedCss = useMemo(() => {
    const parts = [customCss || "", globalHeaderCss, globalFooterCss].filter(Boolean);
    return parts.join("\n\n");
  }, [customCss, globalHeaderCss, globalFooterCss]);

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
      <style dangerouslySetInnerHTML={{ __html: `
        ${mergedCss}
        
        /* Ensure heading tags are visible and styled properly */
        article h1 {
          font-size: 2.25rem !important;
          font-weight: 700 !important;
          margin-top: 2rem !important;
          margin-bottom: 1rem !important;
          line-height: 1.2 !important;
          color: #171717 !important;
        }
        
        article h2 {
          font-size: 1.875rem !important;
          font-weight: 700 !important;
          margin-top: 1.75rem !important;
          margin-bottom: 0.875rem !important;
          line-height: 1.3 !important;
          color: #171717 !important;
        }
        
        article h3 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.75rem !important;
          line-height: 1.4 !important;
          color: #262626 !important;
        }
        
        article h4 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.625rem !important;
          line-height: 1.4 !important;
          color: #262626 !important;
        }
        
        article h5 {
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.5 !important;
          color: #404040 !important;
        }
        
        article h6 {
          font-size: 1rem !important;
          font-weight: 600 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.5 !important;
          color: #404040 !important;
        }
        
        article p {
          margin-bottom: 1rem !important;
          line-height: 1.75 !important;
          color: #525252 !important;
        }
      ` }} />
      
      {/* Header Section */}
      {(globalHeaderHtml || headerContent) ? (
        <div
          dangerouslySetInnerHTML={createMarkup(globalHeaderHtml || headerContent)}
        />
      ) : null}

      {/* Body Section */}
      <main className="flex-1 w-full">
        <article className="max-w-[900px] mx-auto px-6 py-12">
          {bodyContent ? (
            <div
              dangerouslySetInnerHTML={createMarkup(bodyContent)}
            />
          ) : (
            <div className="text-neutral-400 text-center py-12">
              No page content
            </div>
          )}
        </article>
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
  );
}