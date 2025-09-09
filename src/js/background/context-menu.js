/**
 * YouTube Quick Jump - Context Menu Handler
 * Handles the creation and management of context menu items
 */

/**
 * Initialize context menu items for the extension
 */
export function initContextMenu() {
  try {
    // Remove any existing items to avoid duplicates
    chrome.contextMenus.removeAll(() => {
      // Add context menu option to reset the overlay (for recovery)
      chrome.contextMenus.create({
        id: "reset-yt-overlay",
        title: "Reset YouTube Jump UI",
        contexts: ["page"],
        documentUrlPatterns: ["*://*.youtube.com/*"]
      });
    });
  } catch (error) {
    console.error("[redbar] Error initializing context menu:", error);
  }
}

/**
 * Handle context menu item clicks
 * 
 * @param {Object} info - Information about the clicked item
 * @param {Object} tab - Tab where the click occurred
 */
export async function handleContextMenuClick(info, tab) {
  if (!info || !tab || !tab.id) return;
  
  try {
    if (info.menuItemId === "reset-yt-overlay") {
      console.log("[redbar] Resetting overlay");
      await chrome.tabs.sendMessage(tab.id, { type: "RESET_OVERLAY" });
    }
  } catch (error) {
    console.error("[redbar] Error handling context menu click:", error);
  }
}