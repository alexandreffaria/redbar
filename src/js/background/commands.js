/**
 * YouTube Quick Jump - Command Handler
 * Handles keyboard commands/shortcuts
 */

/**
 * Handle commands received from Chrome's command system
 * 
 * @param {string} command - The command name
 */
export async function handleCommand(command) {
  if (command !== "open-timestamp-overlay") return;
  
  try {
    console.log("[redbar] Command fired:", command);
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      console.log("[redbar] No active tab found");
      return;
    }
    
    // Check if the tab is a YouTube page
    if (!/^https?:\/\/([^/]+\.)?youtube\.com\//.test(tab.url || "")) {
      console.log("[redbar] Not a YouTube tab:", tab.url);
      return;
    }
    
    // Send message to content script
    await chrome.tabs.sendMessage(tab.id, { type: "SHOW_OVERLAY" });
  } catch (error) {
    console.error("[redbar] Error handling command:", command, error);
  }
}