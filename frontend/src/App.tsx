import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { PagesList } from "./components/PagesList";
import { PageEditor } from "./components/PageEditor";
import { DynamicPages } from "./components/DynamicPages";
import { MediaLibrary } from "./components/MediaLibrary";
import { Menus } from "./components/Menus";
import { Redirects } from "./components/Redirects";
import { DomainSettings } from "./components/DomainSettings";
import { Forms } from "./components/Forms";
import { PublicPageDemo } from "./components/PublicPageDemo";
import { PublicPage } from "./components/PublicPage";
import { Login } from "./components/Login";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  // Check localStorage on mount to restore authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token;
  });
  
  // Parse URL to get initial view and pageId
  const getInitialStateFromURL = () => {
    try {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      
      // Map URL paths to views
      const viewMap: Record<string, string> = {
        "/pages": "pages",
        "/dynamic-pages": "dynamic-pages",
        "/media": "media",
        "/menus": "menus",
        "/redirects": "redirects",
        "/domain": "domain",
        "/forms": "forms",
        "/public-preview": "public-preview",
      };
      
      let view = "pages";
      let pageId: string | null = null;
      
      // Check if path matches a view
      if (path === "/" || path === "") {
        view = "pages";
      } else if (path.startsWith("/pages/")) {
        view = "pages";
        const pathParts = path.split("/");
        if (pathParts.length > 2) {
          // Extract slug from URL (everything after /pages/)
          pageId = pathParts.slice(2).join("/"); // Join in case slug has slashes
        }
      } else if (viewMap[path]) {
        view = viewMap[path];
      }
      
      // Also check search params for pageSlug (for backward compatibility)
      if (searchParams.has("pageSlug")) {
        pageId = searchParams.get("pageSlug");
      } else if (searchParams.has("pageId")) {
        pageId = searchParams.get("pageId");
      }
      
      return { view, pageId };
    } catch {
      return { view: "pages", pageId: null };
    }
  };
  
  const initialState = getInitialStateFromURL();
  const [activeView, setActiveView] = useState(initialState.view);
  const [editingPageId, setEditingPageId] = useState<string | null>(initialState.pageId);

  // Sync URL with state changes
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear URL when logged out
      window.history.replaceState({}, "", "/");
      return;
    }
    
    let path = "/";
    let searchParams = new URLSearchParams();
    
    // Map views to URL paths
    const viewToPath: Record<string, string> = {
      "pages": "/pages",
      "dynamic-pages": "/dynamic-pages",
      "media": "/media",
      "menus": "/menus",
      "redirects": "/redirects",
      "domain": "/domain",
      "forms": "/forms",
      "public-preview": "/public-preview",
    };
    
    if (viewToPath[activeView]) {
      path = viewToPath[activeView];
    }
    
    // Add page slug to URL if editing a page
    if (activeView === "pages" && editingPageId) {
      // Use slug in URL path
      path = `/pages/${editingPageId}`;
    } else if (editingPageId) {
      searchParams.set("pageSlug", editingPageId);
    }
    
    const url = path + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    window.history.replaceState({}, "", url);
  }, [activeView, editingPageId, isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setActiveView("pages");
    setEditingPageId(null);
    window.history.replaceState({}, "", "/");
  };

  const handleViewChange = (view: string) => {
    // Clear editingPageId when switching views
    // If switching to pages from pages, clear to show list
    // If switching away from pages, also clear
    if (view !== "pages" || (view === "pages" && editingPageId)) {
      setEditingPageId(null);
    }
    setActiveView(view);
  };

  const handleEditPage = (pageId: string) => {
    setEditingPageId(pageId);
  };

  const handleNewPage = () => {
    setEditingPageId("new");
  };

  const handleBackToList = () => {
    setEditingPageId(null);
  };
  
  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        const path = window.location.pathname;
        const searchParams = new URLSearchParams(window.location.search);
        
        const viewMap: Record<string, string> = {
          "/pages": "pages",
          "/dynamic-pages": "dynamic-pages",
          "/media": "media",
          "/menus": "menus",
          "/redirects": "redirects",
          "/domain": "domain",
          "/forms": "forms",
          "/public-preview": "public-preview",
        };
        
        let view = "pages";
        let pageId: string | null = null;
        
        if (path === "/" || path === "") {
          view = "pages";
        } else if (path.startsWith("/pages/")) {
          view = "pages";
          const pathParts = path.split("/");
          if (pathParts.length > 2) {
            pageId = pathParts[2];
          }
        } else if (viewMap[path]) {
          view = viewMap[path];
        }
        
        if (searchParams.has("pageSlug")) {
          pageId = searchParams.get("pageSlug");
        } else if (searchParams.has("pageId")) {
          pageId = searchParams.get("pageId");
        }
        
        setActiveView(view);
        setEditingPageId(pageId);
      } catch {
        setActiveView("pages");
        setEditingPageId(null);
      }
    };
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const renderPlaceholderView = (view: string) => {
    const viewTitles: Record<string, string> = {
      "settings": "System Settings",
    };

    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="border-b border-neutral-200 bg-white">
          <div className="px-8 py-6">
            <h2 className="text-neutral-900">{viewTitles[view]}</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-neutral-200" />
            </div>
            <h3 className="text-neutral-900 mb-2">{viewTitles[view]}</h3>
            <p className="text-neutral-500">This view is coming soon</p>
          </div>
        </div>
      </div>
    );
  };

  // State for public page navigation
  // When user first visits, always show the home page (slug 'home')
  const [publicPageSlug, setPublicPageSlug] = useState(() => {
    const path = window.location.pathname;
    // Convert root path to 'home' so backend can find the page marked as home page
    return path === '/' || path === '' ? 'home' : path.replace(/^\//, '');
  });

  // Handle browser navigation for public pages
  useEffect(() => {
    if (!isAuthenticated) {
      const handlePublicNavigation = () => {
        const currentPath = window.location.pathname;
        const newSlug = currentPath === '/' || currentPath === '' ? 'home' : currentPath.replace(/^\//, '');
        setPublicPageSlug(newSlug);
      };
      
      window.addEventListener('popstate', handlePublicNavigation);
      
      return () => {
        window.removeEventListener('popstate', handlePublicNavigation);
      };
    }
  }, [isAuthenticated]);

  // Show public pages if not authenticated (visitor accessing the domain)
  if (!isAuthenticated) {
    return (
      <>
        <PublicPage slug={publicPageSlug} onNavigate={(path) => {
          // Update URL and state
          window.history.pushState({}, '', path);
          const newSlug = path === '/' || path === '' ? 'home' : path.replace(/^\//, '');
          setPublicPageSlug(newSlug);
        }} />
        <Toaster />
      </>
    );
  }

  // Show dashboard if authenticated
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange}
        onLogout={handleLogout}
      />
      
      {activeView === "pages" && !editingPageId && (
        <PagesList onEditPage={handleEditPage} onNewPage={handleNewPage} />
      )}

      {activeView === "pages" && editingPageId && (
        <PageEditor pageId={editingPageId === "new" ? "new" : editingPageId} onBack={handleBackToList} />
      )}

      {activeView === "dynamic-pages" && <DynamicPages />}

      {activeView === "media" && <MediaLibrary />}

      {activeView === "menus" && <Menus />}

      {activeView === "redirects" && <Redirects />}

      {activeView === "domain" && <DomainSettings />}

      {activeView === "forms" && <Forms />}

      {activeView === "public-preview" && <PublicPageDemo />}

      {activeView !== "pages" && 
       activeView !== "dynamic-pages" && 
       activeView !== "media" && 
       activeView !== "menus" && 
       activeView !== "redirects" && 
       activeView !== "domain" && 
       activeView !== "forms" &&
       activeView !== "public-preview" &&
       renderPlaceholderView(activeView)}
      
      <Toaster />
    </div>
  );
}
