/**
 * YouTube Quick Jump - Content Script Entry Point
 * Initializes and coordinates the extension's functionality
 */

import { initOverlay, showOverlay, hideOverlay, resetOverlay, loadOverlayStyles } from './modules/overlay-ui.js';

/**
 * Main initialization function
 */
function init() {
  try {
    console.log("[yt-quick-jump] Initializing...");
    
    // Initialize the overlay system
    initOverlay();
    
    // Load the CSS
    loadOverlayStyles();
    
    // Listen for messages from the background script
    setupMessageHandlers();
    
    console.log("[yt-quick-jump] Initialization complete");
  } catch (error) {
    console.error("[yt-quick-jump] Initialization error:", error);
  }
}

/**
 * Set up message handlers for communication with background script
 */
function setupMessageHandlers() {
  chrome.runtime.onMessage.addListener((msg) => {
    try {
      if (msg?.type === "SHOW_OVERLAY") {
        console.log("[yt-quick-jump] SHOW_OVERLAY message received");
        showOverlay();
      } else if (msg?.type === "RESET_OVERLAY") {
        console.log("[yt-quick-jump] RESET_OVERLAY message received");
        resetOverlay();
        // After reset, recreate by showing overlay
        setTimeout(() => showOverlay(), 100);
      } else if (msg?.type === "HIDE_OVERLAY") {
        console.log("[yt-quick-jump] HIDE_OVERLAY message received");
        hideOverlay();
      }
    } catch (error) {
      console.error("[yt-quick-jump] Error handling message:", error, msg);
      // Try to recover
      resetOverlay();
    }
  });
}

// Initialize when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}