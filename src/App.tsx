import { useState } from "react";
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
import { Login } from "./components/Login";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState("pages");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveView("pages");
    setEditingPageId(null);
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

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  // Show dashboard if authenticated
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        onLogout={handleLogout}
      />
      
      {activeView === "pages" && !editingPageId && (
        <PagesList onEditPage={handleEditPage} onNewPage={handleNewPage} />
      )}

      {activeView === "pages" && editingPageId && (
        <PageEditor pageId={editingPageId} onBack={handleBackToList} />
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
