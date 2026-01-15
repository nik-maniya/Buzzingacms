import { useState, useEffect } from "react";
import { PublicPageTemplate } from "./PublicPageTemplate";

interface PublicPageProps {
  slug: string;
  onNavigate?: (path: string) => void;
}

// Fetch and render a public page from the CMS API
export function PublicPage({ slug, onNavigate }: PublicPageProps) {
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<{
    title: string;
    body: string;
    headerContent: string;
    footerContent: string;
    headerCss?: string;
    footerCss?: string;
    headerJs?: string;
    footerJs?: string;
    customCss?: string;
    customJs?: string;
    status: "PUBLISHED" | "DRAFT";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch page data
        // If slug is empty or undefined, use empty string to show the page marked as home page
        // Use 'home' only when explicitly navigating to /home
        const pageSlug = slug === 'home' ? 'home' : (slug || '');
        
        // Use relative URL so the domain from window.location is automatically included
        // The backend will extract the domain from req.headers.host
        const apiBase = (import.meta as any).env?.VITE_API_URL
          ? (import.meta as any).env.VITE_API_URL
          : "/api";
        
        // The backend will find the page marked as home page when slug is empty
        // For 'home' slug, it will show the page with slug 'home'
        // Use special endpoint for root path (empty slug)
        // Using relative URL ensures the current domain is sent to backend
        const pageUrl = pageSlug === '' 
          ? `${apiBase}/pages/public` 
          : `${apiBase}/pages/public/${pageSlug}`;
        
        // Fetch with current origin to ensure domain is included in headers
        const pageResponse = await fetch(pageUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Don't include credentials for public pages
          credentials: 'omit',
        });
        
        if (!pageResponse.ok) {
          // Try to get error message from response
          let errorMessage = "Failed to load page";
          try {
            const errorData = await pageResponse.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch {
            // If response is not JSON, use default message
          }
          
          if (pageResponse.status === 404) {
            setError(errorMessage || "Page not found");
          } else if (pageResponse.status === 400) {
            setError(errorMessage || "Invalid request. Please access using a configured domain.");
          } else {
            setError(errorMessage);
          }
          setLoading(false);
          return;
        }

        const pageJson = await pageResponse.json();
        const page = pageJson.data;

        if (!page || page.status !== 'PUBLISHED') {
          setError("Page not found");
          setLoading(false);
          return;
        }

        // Fetch menu data for header and footer
        let headerContent = '';
        let footerContent = '';
        let headerCss = '';
        let footerCss = '';
        let headerJs = '';
        let footerJs = '';
        
        try {
          // Fetch menus using relative URL so domain is included
          const menuResponse = await fetch(`${apiBase}/menus/public`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'omit',
          });
          if (menuResponse.ok) {
            const menuJson = await menuResponse.json();
            const menu = menuJson.data;
            
            if (menu) {
              // Extract header data
              if (menu.header && typeof menu.header === 'object') {
                headerContent = menu.header.html || menu.header.content || '';
                headerCss = menu.header.css || '';
                headerJs = menu.header.js || '';
              } else if (typeof menu.header === 'string') {
                headerContent = menu.header;
              }
              
              // Extract footer data
              if (menu.footer && typeof menu.footer === 'object') {
                footerContent = menu.footer.html || menu.footer.content || '';
                footerCss = menu.footer.css || '';
                footerJs = menu.footer.js || '';
              } else if (typeof menu.footer === 'string') {
                footerContent = menu.footer;
              }
            }
          } else {
            console.warn("Menu API returned non-OK status:", menuResponse.status);
          }
        } catch (menuError) {
          console.error("Failed to load menu:", menuError);
          // Continue without menu if it fails
        }
        
        // Log for debugging
        console.log("Header content:", headerContent ? "Found" : "Empty");
        console.log("Header CSS:", headerCss ? "Found" : "Empty");
        console.log("Footer content:", footerContent ? "Found" : "Empty");
        console.log("Footer CSS:", footerCss ? "Found" : "Empty");

        // Extract content from page
        const contentHtml = page.content?.html || page.contentHtml || '';
        const body = typeof contentHtml === 'string' ? contentHtml : '';

        // Separate CSS: header/footer CSS should not be scoped, page CSS should be scoped
        // We'll pass header/footer CSS separately and merge page CSS with it
        // The PublicPageTemplate will handle scoping correctly if we structure it right
        
        // For now, merge all CSS together - the template will apply it
        // Header and footer CSS should be global (not scoped), page CSS should be scoped
        // We'll include a comment marker to help identify header/footer CSS
        const headerFooterCss = [
          headerCss ? `/* Header CSS */\n${headerCss}` : '',
          footerCss ? `/* Footer CSS */\n${footerCss}` : ''
        ].filter(Boolean).join('\n\n');
        
        const pageCss = page.customCss || '';
        
        // Combine: header/footer CSS (global) + page CSS (will be scoped)
        const allCss = [
          headerFooterCss,
          pageCss
        ].filter(Boolean).join('\n\n');
        
        // Merge all JS: header JS + footer JS + page JS
        const allJs = [
          headerJs,
          footerJs,
          page.customJs || ''
        ].filter(Boolean).join('\n\n');

        setPageData({
          title: page.title || 'Page',
          body: body,
          headerContent: headerContent,
          footerContent: footerContent,
          headerCss: headerCss,
          footerCss: footerCss,
          headerJs: headerJs,
          footerJs: footerJs,
          customCss: allCss, // All CSS (header/footer + page)
          customJs: allJs,   // All JS (header/footer + page)
          status: page.status,
        });
      } catch (err: any) {
        console.error("Error fetching page:", err);
        setError(err.message || "Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neutral-200 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error || !pageData || pageData.status !== "PUBLISHED") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-neutral-900 mb-2 text-4xl font-bold">404</h1>
          <p className="text-neutral-600 text-lg">{error || "Page not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <PublicPageTemplate
      headerContent={pageData.headerContent}
      bodyContent={pageData.body}
      footerContent={pageData.footerContent}
      pageTitle={pageData.title}
      customCss={pageData.customCss}
      customJs={pageData.customJs}
      isPreviewMode={true}
      onNavigate={onNavigate || ((path) => {
        // Default navigation handler
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      })}
    />
  );
}
