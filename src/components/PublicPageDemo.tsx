import { useState } from "react";
import { PublicPageTemplate } from "./PublicPageTemplate";
import { Button } from "./ui/button";
import { Monitor, Tablet, Smartphone, ArrowLeft } from "lucide-react";
import { cn } from "./ui/utils";

export function PublicPageDemo() {
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Mock content from Menus module
  const mockHeaderContent = `<div style="display: flex; justify-content: space-between; align-items: center;">
    <h2 style="margin: 0; font-size: 24px;">Buzzinga</h2>
    <nav style="display: flex; gap: 24px;">
      <a href="/" style="text-decoration: none;">Home</a>
      <a href="/about" style="text-decoration: none;">About</a>
      <a href="/services" style="text-decoration: none;">Services</a>
      <a href="/contact" style="text-decoration: none;">Contact</a>
    </nav>
  </div>`;

  const mockBodyContent = `
    <h2>About Our Agency</h2>
    <p>We are a design & development agency focused on creating exceptional digital experiences. Our team of talented designers and developers work together to bring your vision to life.</p>
    
    <h3>Our Services</h3>
    <ul>
      <li><strong>Web Design & Development</strong> — Beautiful, responsive websites that convert</li>
      <li><strong>Brand Identity</strong> — Complete brand systems that stand out</li>
      <li><strong>Digital Marketing</strong> — Data-driven strategies that deliver results</li>
      <li><strong>Custom CMS Solutions</strong> — Powerful content management tailored to your needs</li>
    </ul>
    
    <h3>Why Choose Buzzinga?</h3>
    <p>With over 10 years of experience, we've helped hundreds of clients transform their digital presence. Our team combines creativity with technical expertise to deliver results that exceed expectations.</p>
    
    <blockquote style="border-left: 4px solid #FBBF24; padding-left: 1rem; margin: 2rem 0; font-style: italic; color: #525252;">
      "Working with Buzzinga was an absolute pleasure. They delivered beyond our expectations and the results speak for themselves."
    </blockquote>
    
    <h3>Our Process</h3>
    <ol>
      <li><strong>Discovery</strong> — We start by understanding your goals and challenges</li>
      <li><strong>Strategy</strong> — We develop a comprehensive plan tailored to your needs</li>
      <li><strong>Design</strong> — Our designers create beautiful, user-centered experiences</li>
      <li><strong>Development</strong> — We build with precision using the latest technologies</li>
      <li><strong>Launch & Support</strong> — We ensure a smooth launch and provide ongoing support</li>
    </ol>
    
    <p>Ready to start your project? <a href="/contact">Get in touch with us today</a> and let's create something amazing together.</p>
  `;

  const mockFooterContent = `<div style="text-align: left;">
    <div style="margin-bottom: 16px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px;">Buzzinga Agency</h3>
      <p style="margin: 0; color: #737373;">Creating exceptional digital experiences since 2015</p>
    </div>
    <div style="display: flex; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
      <a href="/privacy" style="text-decoration: none;">Privacy Policy</a>
      <a href="/terms" style="text-decoration: none;">Terms of Service</a>
      <a href="mailto:hello@buzzinga.com" style="text-decoration: none;">hello@buzzinga.com</a>
    </div>
    <p style="margin-top: 16px; font-size: 14px; color: #737373;">&copy; 2025 Buzzinga. All rights reserved.</p>
  </div>`;

  const devices = [
    { id: "desktop" as const, label: "Desktop", icon: Monitor },
    { id: "tablet" as const, label: "Tablet", icon: Tablet },
    { id: "mobile" as const, label: "Mobile", icon: Smartphone },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-neutral-900">Public Page Preview</h2>
              <p className="text-sm text-neutral-500 mt-1">
                See how published pages render with Header + Body + Footer
              </p>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              {devices.map((device) => {
                const Icon = device.icon;
                return (
                  <button
                    key={device.id}
                    onClick={() => setDeviceView(device.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm",
                      deviceView === device.id
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{device.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-neutral-50 p-8">
        <div className="flex justify-center">
          <div
            className={cn(
              "bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300",
              deviceView === "desktop" && "w-full max-w-[1440px]",
              deviceView === "tablet" && "w-[768px]",
              deviceView === "mobile" && "w-[375px]"
            )}
          >
            {/* Browser Chrome */}
            <div className="h-10 bg-neutral-100 border-b border-neutral-200 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-6 bg-white rounded border border-neutral-200 px-3 flex items-center">
                  <span className="text-xs text-neutral-400">
                    https://yoursite.com/about
                  </span>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
              <PublicPageTemplate
                headerContent={mockHeaderContent}
                bodyContent={mockBodyContent}
                footerContent={mockFooterContent}
                pageTitle="About Us"
                deviceView={deviceView}
              />
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="max-w-[1440px] mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm text-neutral-900 mb-1">Header Section</h3>
            <p className="text-xs text-neutral-500">
              Global content from Menus → Header. Appears on all published pages.
            </p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm text-neutral-900 mb-1">Body Section</h3>
            <p className="text-xs text-neutral-500">
              Unique content from each page's editor. Max width 900px, centered.
            </p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm text-neutral-900 mb-1">Footer Section</h3>
            <p className="text-xs text-neutral-500">
              Global content from Menus → Footer. Appears on all published pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
