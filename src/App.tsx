import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { PagesList } from "./components/PagesList";
import { PageEditor } from "./components/PageEditor";

export default function App() {
  const [activeView, setActiveView] = useState("pages");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

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
      "dynamic-pages": "Dynamic Pages",
      "media": "Media Library",
      "menus": "Menus",
      "redirects": "Redirects",
      "domain": "Domain & DNS",
      "seo": "SEO Settings",
      "backups": "Backups & Revisions",
      "submissions": "Contact Submissions",
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

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      {activeView === "pages" && !editingPageId && (
        <PagesList onEditPage={handleEditPage} onNewPage={handleNewPage} />
      )}

      {activeView === "pages" && editingPageId && (
        <PageEditor pageId={editingPageId} onBack={handleBackToList} />
      )}

      {activeView !== "pages" && renderPlaceholderView(activeView)}
    </div>
  );
}
