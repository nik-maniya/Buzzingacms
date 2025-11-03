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
  // Render HTML content safely (in production, use DOMPurify)
  const createMarkup = (html: string) => {
    return { __html: html };
  };

  // Load global header/footer from Menus API (applies across all pages)
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    if (!token) return;

    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://localhost:5000";

    fetch(`${apiBase}/api/menus`, { headers: { Authorization: `Bearer ${token}` } })
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
      {mergedCss ? (
        <style dangerouslySetInnerHTML={{ __html: mergedCss }} />
      ) : null}
      {/* Header Section */}
      <header className="w-full bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          {globalHeaderHtml || headerContent ? (
            <div
              className="prose prose-invert max-w-none [&_a]:text-yellow-400 [&_a:hover]:text-yellow-500 [&_h1]:text-neutral-100 [&_h2]:text-neutral-100 [&_h3]:text-neutral-100 [&_p]:text-neutral-300"
              dangerouslySetInnerHTML={createMarkup(globalHeaderHtml || headerContent)}
            />
          ) : (
            <div className="text-neutral-400 text-sm">No header content</div>
          )}
        </div>
      </header>

      {/* Body Section */}
      <main className="flex-1 w-full">
        <article className="max-w-[900px] mx-auto px-6 py-12">
          {/* Page Body Content */}
          {bodyContent ? (
            <div
              className="prose prose-neutral max-w-none [&_a]:text-blue-600 [&_a:hover]:text-blue-700 [&_img]:rounded-lg [&_img]:shadow-md [&_h1]:text-neutral-900 [&_h2]:text-neutral-900 [&_h3]:text-neutral-800 [&_p]:text-neutral-700 [&_p]:leading-relaxed"
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
      <footer className="w-full bg-neutral-100 border-t border-neutral-200">
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          {globalFooterHtml || footerContent ? (
            <div
              className="prose prose-sm prose-neutral max-w-none [&_a]:text-neutral-600 [&_a:hover]:text-neutral-900 [&_h1]:text-neutral-900 [&_h2]:text-neutral-900 [&_h3]:text-neutral-800 [&_p]:text-neutral-600"
              dangerouslySetInnerHTML={createMarkup(globalFooterHtml || footerContent)}
            />
          ) : (
            <div className="text-neutral-400 text-sm">No footer content</div>
          )}
        </div>
      </footer>
      
      {/* Script mount point - custom JS will be injected here and executed */}
      <div ref={scriptMountRef} />
    </div>
  );
}
