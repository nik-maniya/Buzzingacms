interface PublicPageTemplateProps {
  headerContent: string;
  bodyContent: string;
  footerContent: string;
  pageTitle?: string;
  deviceView?: "desktop" | "tablet" | "mobile";
  customCss?: string;
}

export function PublicPageTemplate({
  headerContent,
  bodyContent,
  footerContent,
  pageTitle = "Page Title",
  deviceView = "desktop",
  customCss,
}: PublicPageTemplateProps) {
  // Render HTML content safely (in production, use DOMPurify)
  const createMarkup = (html: string) => {
    return { __html: html };
  };

  const containerWidth =
    deviceView === "desktop"
      ? "w-full"
      : deviceView === "tablet"
      ? "w-[768px]"
      : "w-[375px]";

  return (
    <div className={`${containerWidth} mx-auto bg-white min-h-screen flex flex-col`}>
      {/* Custom CSS for preview/published rendering */}
      {customCss ? (
        <style dangerouslySetInnerHTML={{ __html: customCss }} />
      ) : null}
      {/* Header Section */}
      <header className="w-full bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          {headerContent ? (
            <div
              className="prose prose-invert max-w-none [&_a]:text-yellow-400 [&_a:hover]:text-yellow-500 [&_h1]:text-neutral-100 [&_h2]:text-neutral-100 [&_h3]:text-neutral-100 [&_p]:text-neutral-300"
              dangerouslySetInnerHTML={createMarkup(headerContent)}
            />
          ) : (
            <div className="text-neutral-400 text-sm">No header content</div>
          )}
        </div>
      </header>

      {/* Body Section */}
      <main className="flex-1 w-full">
        <article className="max-w-[900px] mx-auto px-6 py-12">
          {/* Page Title */}
          {pageTitle && (
            <h1 className="text-neutral-900 mb-8">{pageTitle}</h1>
          )}

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
          {footerContent ? (
            <div
              className="prose prose-sm prose-neutral max-w-none [&_a]:text-neutral-600 [&_a:hover]:text-neutral-900 [&_h1]:text-neutral-900 [&_h2]:text-neutral-900 [&_h3]:text-neutral-800 [&_p]:text-neutral-600"
              dangerouslySetInnerHTML={createMarkup(footerContent)}
            />
          ) : (
            <div className="text-neutral-400 text-sm">No footer content</div>
          )}
        </div>
      </footer>
    </div>
  );
}
