/**
 * Utility function to copy text to clipboard with fallback support
 * @param text The text to copy
 * @returns Promise<boolean> True if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try using the modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback: use the legacy execCommand method
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        return successful;
      } catch (err) {
        document.body.removeChild(textarea);
        return false;
      }
    }
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}
