import { useEffect, useState, useMemo, useCallback } from "react";
import { ArrowLeft, Eye, ExternalLink, X } from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CodeEditor } from "./CodeEditor";
import { MetadataPanel } from "./MetadataPanel";
import { WysiwygEditor } from "./WysiwygEditor";
import { PagePreview } from "./PagePreview";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { PublicPageTemplate } from "./PublicPageTemplate";
import { toast } from "sonner";

interface PageEditorProps {
  pageId: string; // Can be ID, slug, or "new"
  onBack: () => void;
}

export function PageEditor({ pageId, onBack }: PageEditorProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [cssCode, setCssCode] = useState(".hero {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  padding: 4rem 2rem;\n  color: white;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n}");
  const [jsCode, setJsCode] = useState("// Page initialization\ndocument.addEventListener('DOMContentLoaded', () => {\n  console.log('Page loaded');\n  \n  // Add smooth scroll\n  document.querySelectorAll('a[href^=\"#\"]').forEach(anchor => {\n    anchor.addEventListener('click', function (e) {\n      e.preventDefault();\n      const target = document.querySelector(this.getAttribute('href'));\n      target?.scrollIntoView({ behavior: 'smooth' });\n    });\n  });\n});");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [previewHeaderHtml, setPreviewHeaderHtml] = useState<string>("");
  const [previewFooterHtml, setPreviewFooterHtml] = useState<string>("");
  const [collections, setCollections] = useState<any[]>([]);
  const [itemDetailData, setItemDetailData] = useState<{
    htmlContent: string;
    customCss: string;
    customJs: string;
  } | null>(null);
  const [loadingItemDetail, setLoadingItemDetail] = useState(false);
  const [viewingItemDetailInPreview, setViewingItemDetailInPreview] = useState(false);

  // Load collections with items
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://localhost:5000";

    fetch(`${apiBase}/api/collections/with-items`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const res = await r.json();
        if (r.ok && res?.data) {
          setCollections(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {});
  }, []);

  // Function to open item detail (inline in preview tab, not in separate dialog)
  const openItemDetail = async (collectionId: number, itemId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://localhost:5000";

    setLoadingItemDetail(true);
    setViewingItemDetailInPreview(true);

    try {
      const response = await fetch(
        `${apiBase}/api/page-templates/renderItem/${collectionId}/${itemId}`,
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
        toast.error(res?.message || 'Failed to load item detail');
        setViewingItemDetailInPreview(false);
      }
    } catch (error) {
      toast.error('Failed to load item detail');
      setViewingItemDetailInPreview(false);
    } finally {
      setLoadingItemDetail(false);
    }
  };

  // Function to go back to page preview
  const goBackToPagePreview = () => {
    setViewingItemDetailInPreview(false);
    setItemDetailData(null);
  };

  // Reset item detail view when switching away from preview tab
  useEffect(() => {
    if (activeTab !== "preview") {
      setViewingItemDetailInPreview(false);
      setItemDetailData(null);
      setLoadingItemDetail(false);
    }
  }, [activeTab]);

  // Listen for messages from iframe to open item detail
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'openItemDetail') {
        const { collectionId, itemId } = event.data;
        console.log('Received postMessage:', { collectionId, itemId });
        await openItemDetail(collectionId, itemId);
      }
    };
    
    // Also listen for custom events from Full Preview (direct rendering, not iframe)
    const handleCustomEvent = async (event: CustomEvent) => {
      console.log('Received custom event:', event.detail);
      if (event.detail?.collectionId && event.detail?.itemId) {
        await openItemDetail(event.detail.collectionId, event.detail.itemId);
      }
    };
    
    window.addEventListener('message', handleMessage);
    window.addEventListener('openItemDetail', handleCustomEvent as EventListener);
    
    console.log('Event listeners attached for item detail');
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('openItemDetail', handleCustomEvent as EventListener);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load page data if editing existing page
  useEffect(() => {
    if (!pageId || pageId === "new") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://localhost:5000";

    setIsLoading(true);
    fetch(`${apiBase}/api/pages/${pageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) throw new Error(res?.message || "Failed to load page");
        const p = res?.data;
        if (!p) return;
        setTitle(p.title || "");
        setSlug(p.slug || "");
        // content can be a JSON object or a plain string in DB
        let htmlContent = "";
        if (typeof p.content === "string") {
          htmlContent = p.content;
        } else if (p.content && typeof p.content === "object") {
          htmlContent = p.content.html || p.content.body || "";
        }
        setContent(typeof htmlContent === "string" ? htmlContent : "");
        if (typeof p.customCss === "string") setCssCode(p.customCss);
        if (typeof p.customJs === "string") setJsCode(p.customJs);
        if (p.status === "PUBLISHED") setStatus("PUBLISHED"); else setStatus("DRAFT");
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [pageId]);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://localhost:5000";

    const normalizedSlug = slug.startsWith("/") ? slug.slice(1) : slug;

    try {
      const isNew = !pageId || pageId === "new";
      const url = isNew ? `${apiBase}/api/pages` : `${apiBase}/api/pages/${pageId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          slug: normalizedSlug,
          content: { html: content },
          customCss: cssCode,
          customJs: jsCode,
          status,
          description: "",
          keywords: [],
          ogImage: undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create page");
      toast.success(isNew ? "Page created successfully" : "Page updated successfully");
      onBack();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save page");
    }
  };

  // Build preview header/footer dynamically from user-created pages when modal opens
  useEffect(() => {
    if (!showFullPreview) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setPreviewHeaderHtml("");
      setPreviewFooterHtml("");
      return;
    }
    const apiBase = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL
      : "http://localhost:5000";

    fetch(`${apiBase}/api/pages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) throw new Error(res?.message || "Failed to load pages");
        const list = Array.isArray(res?.data) ? res.data : [];
        // Only published pages, sorted by title
        const pages = list
          .filter((p: any) => p?.status === "DRAFT")
          .sort((a: any, b: any) => String(a.title).localeCompare(String(b.title)));
        const navLinks = pages
          .map((p: any) => {
            const s = typeof p.slug === 'string' ? p.slug : '';
            const href = s.startsWith('/') ? s : `/${s}`;
            return `<a href="${href}" style="text-decoration: none;">${p.title}</a>`;
          })
          .join("\n      ");

        const header = `<div style="display: flex; justify-content: space-between; align-items: center;">
    <h2 style="margin: 0; font-size: 24px;">Buzzinga</h2>
    <nav style="display: flex; gap: 24px;">
      ${navLinks}
    </nav>
  </div>`;
        setPreviewHeaderHtml(header);

        const footer = `<div style="text-align: left;">
    <p style="margin-bottom: 8px;">&copy; 2025 Buzzinga. All rights reserved.</p>
  </div>`;
        setPreviewFooterHtml(footer);
      })
      .catch(() => {
        setPreviewHeaderHtml("");
        setPreviewFooterHtml("");
      });
  }, [showFullPreview]);

  const deviceSizes = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  // Function to replace field placeholders in item template
  const replaceFieldPlaceholders = (template: string, itemData: any, fields: any[]): string => {
    let processed = template;
    
    // First, try to match fields by their fieldLabel
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
        // Replace {{fieldLabel}} and variations (case-insensitive)
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
    
    // Then replace any remaining placeholders from itemData directly
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
          const regex = new RegExp(`\\{\\{${escaped}\\}\\}`, 'gi');
          processed = processed.replace(regex, String(value));
        });
      }
    });
    
    return processed;
  };

  // Function to replace collection placeholders and render blog list
  const replaceCollectionPlaceholders = useMemo(() => {
    return (html: string): string => {
      if (!html) return html;
      if (collections.length === 0) return html;
      
      let processedHtml = html;
      
      // Match {{collection:slug}} pattern
      const collectionPattern = /\{\{collection:([^}]+)\}\}/g;
      const collectionMatches = Array.from(html.matchAll(collectionPattern));
      
      if (collectionMatches.length > 0) {
        // Process collections in reverse order to maintain correct indices
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
          
          // Find the placeholder in the current processed HTML
          const placeholderIndex = processedHtml.indexOf(fullMatch);
          if (placeholderIndex === -1) return; // Already processed
          
          // Split: content before placeholder, and template after placeholder
          const beforePlaceholder = processedHtml.substring(0, placeholderIndex);
          const afterPlaceholder = processedHtml.substring(placeholderIndex + fullMatch.length);
          
          // Extract template - everything after the collection placeholder BUT stop at next {{collection:slug}}
          // This ensures each collection has its own template
          let template = '';
          const nextCollectionPattern = /\{\{collection:([^}]+)\}\}/;
          const nextMatch = afterPlaceholder.match(nextCollectionPattern);
          
          if (nextMatch && nextMatch.index !== undefined) {
            // There's another collection placeholder after this one
            // Template is everything between this placeholder and the next one
            template = afterPlaceholder.substring(0, nextMatch.index).trim();
          } else {
            // No more collection placeholders, template is everything after this placeholder
            template = afterPlaceholder.trim();
          }
          
          // If no template provided after placeholder, create a default one
          if (!template || template.length === 0) {
            template = `
              <div class="collection-item" style="margin-bottom: 2rem; padding: 1.5rem; border: 1px solid #e5e5e5; border-radius: 8px;">
                <h2>{{title}}</h2>
                <p>{{description}}</p>
              </div>
            `;
          }
          
          // Render each item using ONLY the template (not the entire HTML)
          // Each item will be rendered separately, so if you have 2 items, you'll get 2 rendered templates
          const itemsHtml = items
            .map((item: any, index: number) => {
              const itemData = item.data || {};
              
              // Add item metadata to itemData for use in templates
              const enhancedItemData = {
                ...itemData,
                _itemId: item.id,
                _itemIndex: index,
                _itemNumber: index + 1,
                _totalItems: items.length,
                // Slug is usually stored in itemData, but ensure it's accessible
                slug: itemData.slug || itemData.Slug || itemData.SLUG || '',
              };
              
              // Use ONLY the template part (after placeholder), replacing field placeholders with item data
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
                  // Add data attributes and onclick that works in both iframe and direct rendering
                  const safeOnclick = `(function(){try{if(window.parent!==window){window.parent.postMessage({type:'openItemDetail',collectionId:${collectionId},itemId:${itemId}},'*');}else{window.dispatchEvent(new CustomEvent('openItemDetail',{detail:{collectionId:${collectionId},itemId:${itemId}}}));}}catch(e){console.error(e);}})();`;
                  return `<${tag}${attrs} data-collection-id="${collectionId}" data-item-id="${itemId}" onclick="${safeOnclick}" style="cursor: pointer; text-decoration: underline;">${content}</${tag}>`;
                }
              );
              
              // Also make links clickable (in case blog items are rendered as links)
              itemHtml = itemHtml.replace(
                /<a([^>]*)>(.*?)<\/a>/gi,
                (match, attrs, content) => {
                  // Check if already has onclick or data attributes, or if it's an external link
                  if (attrs.includes('onclick') || attrs.includes('data-collection-id') || attrs.includes('href="http')) return match;
                  // Add data attributes and onclick - event is automatically available
                  const safeOnclick = `event.preventDefault();event.stopPropagation();try{if(window.parent!==window){window.parent.postMessage({type:'openItemDetail',collectionId:${collectionId},itemId:${itemId}},'*');}else{window.dispatchEvent(new CustomEvent('openItemDetail',{detail:{collectionId:${collectionId},itemId:${itemId}}}));}}catch(err){console.error(err);}return false;`;
                  return `<a${attrs} data-collection-id="${collectionId}" data-item-id="${itemId}" onclick="${safeOnclick}" style="cursor: pointer;">${content}</a>`;
                }
              );
              
              // Add item-specific classes and data attributes for styling
              itemHtml = itemHtml.replace(
                /<(\w+)([^>]*)>/g,
                (match, tag, attrs) => {
                  // Add data-item-id and data-item-index to the first element of each item
                  if (!attrs.includes('data-item-id')) {
                    return `<${tag}${attrs} data-item-id="${item.id}" data-item-index="${index}" data-item-slug="${enhancedItemData.slug}">`;
                  }
                  return match;
                }
              );
              
              return itemHtml;
            })
            .join('\n');
          
          // Replace the collection placeholder with rendered items
          // Keep content before placeholder, add rendered items, then add remaining content (for next collection)
          const remainingContent = nextMatch && nextMatch.index !== undefined 
            ? afterPlaceholder.substring(nextMatch.index) 
            : '';
          processedHtml = beforePlaceholder + itemsHtml + remainingContent;
        });
      } else {
        // No collection placeholder, but might have field placeholders
        const fieldPattern = /\{\{([^}]+)\}\}/g;
        const hasFieldPlaceholders = fieldPattern.test(html);
        
        if (hasFieldPlaceholders) {
          // Try each collection to find matching fields
          for (const collection of collections) {
            if (collection.items && collection.items.length > 0) {
              const fields = collection.fields || [];
              const firstItem = collection.items[0];
              const itemData = firstItem.data || {};
              
              const testResult = replaceFieldPlaceholders(html, itemData, fields);
              if (testResult !== html) {
                processedHtml = testResult;
                break;
              }
            }
          }
        }
      }
      
      return processedHtml;
    };
  }, [collections]);

  // Process content to replace placeholders
  const processedContent = useMemo(() => {
    return replaceCollectionPlaceholders(content || '');
  }, [content, collections, replaceCollectionPlaceholders]);

  // Escape script tags in JS code
  const escapedJs = (jsCode || '').replace(/<\/script>/gi, '<\\/script>');
  
  // Helper function to scope CSS to .cms-page
  const scopeCssForIframe = useCallback((css: string): string => {
    if (!css) return '';
    return css.replace(/([^{}]+)\{/g, (match, selector) => {
      // Skip if already scoped or is a special rule
      if (selector.includes('.cms-page') || selector.trim().startsWith('@')) {
        return match;
      }
      // Scope the selector
      const scopedSelector = selector.split(',').map(s => {
        const trimmed = s.trim();
        // Don't double-scope
        if (trimmed.includes('.cms-page')) return trimmed;
        // Handle pseudo-selectors and special cases
        if (trimmed.startsWith(':') || trimmed.startsWith('@')) return trimmed;
        return `.cms-page ${trimmed}`;
      }).join(', ');
      return `${scopedSelector}{`;
    });
  }, []);

  // Escape CSS to prevent breaking style tag
  const escapedCss = (cssCode || '').replace(/<\/style>/gi, '<\\/style>');
  // Scope CSS to .cms-page for iframe preview
  const scopedCss = scopeCssForIframe(escapedCss);
  
  // For HTML content, we need to escape only template literal special characters
  // but NOT HTML tags - we want them to render as actual HTML
  // Escape backticks and ${ to prevent template literal injection
  const safeContent = (processedContent || '')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  
  // Create iframe srcDoc for item detail to completely isolate CSS
  const itemDetailSrcDoc = useMemo(() => {
    if (!itemDetailData) return '';
    
    const itemEscapedCss = (itemDetailData.customCss || '').replace(/<\/style>/gi, '<\\/style>');
    const itemScopedCss = scopeCssForIframe(itemEscapedCss);
    const itemEscapedJs = (itemDetailData.customJs || '').replace(/<\/script>/gi, '<\\/script>');
    const itemSafeContent = (itemDetailData.htmlContent || '')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');
    
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${itemScopedCss}</style>
  </head>
  <body style="margin: 0; padding: 0;">
    <div class="cms-page" style="padding: 2rem; min-height: 100vh;">
      ${itemSafeContent}
    </div>
    <script>
      (function() {
        ${itemEscapedJs}
        
        // Ensure DOMContentLoaded event fires for any listeners
        if (document.readyState !== 'loading') {
          setTimeout(function() {
            var evt;
            try {
              evt = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
            } catch(e) {
              evt = document.createEvent('Event');
              evt.initEvent('DOMContentLoaded', true, true);
            }
            document.dispatchEvent(evt);
            window.dispatchEvent(evt);
          }, 0);
        }
      })();
    </script>
  </body>
</html>`;
  }, [itemDetailData, scopeCssForIframe]);
  
  const previewSrcDoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${scopedCss}</style>
  </head>
  <body>
    <div class="cms-page" style="padding: 2rem">
      <div class="prose" style="max-width:none;color:#171717">${safeContent}</div>
    </div>
    <script>
      (function() {
        ${escapedJs}
        
        // Ensure DOMContentLoaded event fires for any listeners
        if (document.readyState !== 'loading') {
          setTimeout(function() {
            var evt;
            try {
              evt = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
            } catch(e) {
              evt = document.createEvent('Event');
              evt.initEvent('DOMContentLoaded', true, true);
            }
            document.dispatchEvent(evt);
            window.dispatchEvent(evt);
          }, 0);
        }
      })();
    </script>
  </body>
</html>`;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-neutral-600 hover:text-neutral-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-neutral-200" />
            <h2 className="text-neutral-900">{title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(value: "DRAFT" | "PUBLISHED") => setStatus(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              size="sm"
              onClick={handleSave}
            >
              Save Page
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFullPreview(true)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Full Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-y-auto">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-neutral-200 px-8">
              <TabsList className="bg-transparent h-12 p-0 space-x-1">
                <TabsTrigger
                  value="content"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                >
                  Content
                </TabsTrigger>
                <TabsTrigger
                  value="css"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                >
                  CSS
                </TabsTrigger>
                <TabsTrigger
                  value="js"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                >
                  JS
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-yellow-400 rounded-none px-4"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto">
              <TabsContent value="content" className="h-full m-0 p-8 overflow-auto">
                <div className="max-w-3xl space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="border-neutral-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="border-neutral-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">Content</Label>
                      {collections.length > 0 && (
                        <Select
                          onValueChange={(value) => {
                            const placeholder = `{{collection:${value}}}`;
                            setContent((prev) => prev + `\n\n${placeholder}\n\n`);
                            toast.success(`Collection placeholder inserted: ${placeholder}`);
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Insert Collection" />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map((collection) => (
                              <SelectItem key={collection.id} value={collection.slug}>
                                {collection.name} ({collection.items?.length || 0} items)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <WysiwygEditor value={content} onChange={setContent} />
                    {collections.length > 0 && (
                      <div className="text-sm text-neutral-500 mt-2 space-y-1 p-3 bg-neutral-50 rounded border border-neutral-200">
                        <p>
                          <strong>Blog List Example:</strong> To display a list of blog posts, use:
                        </p>
                        <div className="mt-2 space-y-1 text-xs font-mono bg-white p-2 rounded">
                          <div className="text-neutral-600">{`<!-- Content before collection (shown once) -->`}</div>
                          <div className="text-neutral-600">{`<h1>My Blog</h1>`}</div>
                          <div className="mt-2">{`{{collection:blog}}`}</div>
                          <div className="mt-2 text-neutral-600">{`<!-- Template for each item (put AFTER collection placeholder) -->`}</div>
                          <div className="ml-4">{`<div class="blog-item">`}</div>
                          <div className="ml-8">{`<h2><a href="/blog/{{slug}}">{{title}}</a></h2>`}</div>
                          <div className="ml-8">{`<p>{{description}}</p>`}</div>
                          <div className="ml-4">{`</div>`}</div>
                        </div>
                        <p className="text-xs mt-2 font-semibold text-neutral-700">
                          ⚠️ Important: Put your template HTML AFTER the collection placeholder!
                        </p>
                        <p className="text-xs mt-1">
                          <strong>Multiple Items:</strong> If you have 2 items, both will be displayed. Each item uses the template AFTER <code className="bg-white px-1 py-0.5 rounded">{`{{collection:blog}}`}</code>
                        </p>
                        <p className="text-xs mt-1">
                          <strong>Field Names:</strong> Use exact field labels from your collection (case-insensitive). Example: if field is "Title", use <code className="bg-white px-1 py-0.5 rounded">{`{{title}}`}</code> or <code className="bg-white px-1 py-0.5 rounded">{`{{Title}}`}</code>
                        </p>
                        <p className="text-xs mt-1">
                          <strong>Item Slug:</strong> Use <code className="bg-white px-1 py-0.5 rounded">{`{{slug}}`}</code> for item slugs in links.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="css" className="h-full m-0">
                <CodeEditor value={cssCode} onChange={setCssCode} language="css" />
              </TabsContent>

              <TabsContent value="js" className="h-full m-0">
                <CodeEditor value={jsCode} onChange={setJsCode} language="javascript" />
              </TabsContent>

              <TabsContent value="preview" className="h-full m-0 p-8 bg-neutral-50 overflow-auto preview-scrollbar">
                <style>{`
                  .preview-scrollbar::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                  }
                  .preview-scrollbar::-webkit-scrollbar-track {
                    background: #f5f5f5;
                    border-radius: 5px;
                  }
                  .preview-scrollbar::-webkit-scrollbar-thumb {
                    background: #d4d4d4;
                    border-radius: 5px;
                  }
                  .preview-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #a3a3a3;
                  }
                  .preview-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #d4d4d4 #f5f5f5;
                  }
                `}</style>
                {viewingItemDetailInPreview && (
                  <div className="mb-4 flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goBackToPagePreview}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Preview
                    </Button>
                    <div className="h-6 w-px bg-neutral-200" />
                    <h3 className="text-neutral-900">Item Detail</h3>
                  </div>
                )}
                {!viewingItemDetailInPreview && (
                  <div className="mb-4 flex items-center justify-center gap-2">
                    <Button
                      variant={previewDevice === "desktop" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewDevice("desktop")}
                      className={previewDevice === "desktop" ? "bg-neutral-900" : ""}
                    >
                      Desktop
                    </Button>
                    <Button
                      variant={previewDevice === "tablet" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewDevice("tablet")}
                      className={previewDevice === "tablet" ? "bg-neutral-900" : ""}
                    >
                      Tablet
                    </Button>
                    <Button
                      variant={previewDevice === "mobile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewDevice("mobile")}
                      className={previewDevice === "mobile" ? "bg-neutral-900" : ""}
                    >
                      Mobile
                    </Button>
                  </div>
                )}
                <div className="flex justify-center">
                  <div
                    className="bg-white border border-neutral-200 rounded-lg overflow-auto shadow-lg transition-all preview-scrollbar"
                    style={{ width: deviceSizes[previewDevice], minHeight: "600px", maxHeight: "calc(100vh - 300px)" }}
                  >
                    {viewingItemDetailInPreview ? (
                      loadingItemDetail ? (
                        <div className="flex items-center justify-center h-full min-h-[600px]">
                          <p className="text-neutral-500">Loading item detail...</p>
                        </div>
                      ) : itemDetailData ? (
                        <iframe
                          title="Item Detail Preview"
                          style={{ width: "100%", height: "100%", border: 0 }}
                          sandbox="allow-scripts allow-same-origin"
                          srcDoc={itemDetailSrcDoc}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full min-h-[600px]">
                          <p className="text-neutral-500">No item data available</p>
                        </div>
                      )
                    ) : (
                      <iframe
                        title="Live Preview"
                        style={{ width: "100%", height: "100%", border: 0 }}
                        sandbox="allow-scripts allow-same-origin"
                        srcDoc={previewSrcDoc}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Sidebar - Metadata Panel */}
        <MetadataPanel />
      </div>

      {/* Full Page Preview Modal */}
      <PagePreview
        open={showFullPreview}
        onClose={() => setShowFullPreview(false)}
        pageTitle={title}
        pageBody={processedContent}
        headerContent={previewHeaderHtml}
        footerContent={previewFooterHtml}
        customCss={cssCode}
        customJs={jsCode}
      />

    </div>
  );
}
