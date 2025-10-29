import { useState, useEffect } from "react";
import { PublicPageTemplate } from "./PublicPageTemplate";

interface PublicPageProps {
  slug: string;
}

// This component simulates fetching and rendering a public page
// In production, this would fetch from your CMS API
export function PublicPage({ slug }: PublicPageProps) {
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<{
    title: string;
    body: string;
    headerContent: string;
    footerContent: string;
    status: "published" | "draft";
  } | null>(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchPage = async () => {
      setLoading(true);

      // Mock data - in production, fetch from API
      const mockData = {
        title: "Welcome to Buzzinga",
        body: `
          <h2>About Our Agency</h2>
          <p>We are a design & development agency focused on creating exceptional digital experiences.</p>
          
          <h3>Our Services</h3>
          <ul>
            <li>Web Design & Development</li>
            <li>Brand Identity</li>
            <li>Digital Marketing</li>
            <li>Custom CMS Solutions</li>
          </ul>
          
          <h3>Why Choose Us?</h3>
          <p>With over 10 years of experience, we've helped hundreds of clients transform their digital presence. Our team combines creativity with technical expertise to deliver results that exceed expectations.</p>
          
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop" alt="Team collaboration" style="width: 100%; margin: 2rem 0;" />
          
          <p>Ready to start your project? <a href="/contact">Get in touch with us today</a>.</p>
        `,
        headerContent: `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; font-size: 24px;">Buzzinga</h2>
            <nav style="display: flex; gap: 24px;">
              <a href="/" style="text-decoration: none;">Home</a>
              <a href="/about" style="text-decoration: none;">About</a>
              <a href="/services" style="text-decoration: none;">Services</a>
              <a href="/contact" style="text-decoration: none;">Contact</a>
            </nav>
          </div>
        `,
        footerContent: `
          <div style="text-align: left;">
            <p style="margin-bottom: 8px;">&copy; 2025 Buzzinga. All rights reserved.</p>
            <div style="display: flex; gap: 16px; margin-top: 12px;">
              <a href="/privacy" style="text-decoration: none;">Privacy Policy</a>
              <a href="/terms" style="text-decoration: none;">Terms of Service</a>
              <a href="mailto:hello@buzzinga.com" style="text-decoration: none;">hello@buzzinga.com</a>
            </div>
          </div>
        `,
        status: "published" as const,
      };

      // Simulate network delay
      setTimeout(() => {
        setPageData(mockData);
        setLoading(false);
      }, 500);
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

  if (!pageData || pageData.status !== "published") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-neutral-900 mb-2">404</h1>
          <p className="text-neutral-600">Page not found</p>
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
    />
  );
}
