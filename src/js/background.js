/**
 * YouTube Quick Jump - Background Script Entry Point
 */

import { initContextMenu, handleContextMenuClick } from './background/context-menu.js';
import { handleCommand } from './background/commands.js';

/**
 * Initialize the extension's background functionality
 */
function init() {
  try {
    console.log("[redbar] Background script initializing");
    
    // Initialize context menu
    initContextMenu();
    
    // Set up command listener
    chrome.commands.onCommand.addListener(handleCommand);
    
    // Set up context menu click listener
    chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
    
    console.log("[redbar] Background script initialized successfully");
  } catch (error) {
    console.error("[redbar] Background initialization error:", error);
  }
}

// Initialize when loaded
init();