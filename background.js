// Receives the command (hotkey) and forwards it to the active YouTube tab
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-timestamp-overlay") return;
  console.log("[redbar] command fired");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    if (!/^https?:\/\/([^/]+\.)?youtube\.com\//.test(tab.url || "")) {
      console.log("[redbar] not a YouTube tab:", tab.url);
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: "SHOW_OVERLAY" });
  } catch (error) {
    console.error("[redbar] Error sending command:", error);
  }
});

// Add context menu option to reset the overlay (for recovery)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "reset-yt-overlay",
    title: "Reset YouTube Jump UI",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.youtube.com/*"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "reset-yt-overlay" && tab && tab.id) {
    console.log("[redbar] Resetting overlay");
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "RESET_OVERLAY" });
    } catch (error) {
      console.error("[redbar] Error resetting overlay:", error);
    }
  }
});
