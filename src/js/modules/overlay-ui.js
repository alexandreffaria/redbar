/**
 * YouTube Quick Jump - Overlay UI Module
 * Manages the timestamp entry overlay UI
 */

import { parseTimestamp } from '../utils/time-parser.js';
import { jumpToTime } from './video-controller.js';

// UI elements
let overlayEl = null;
let inputEl = null;
let backdropEl = null;

// Timeout handle for auto-hide
let overlayTimeout = null;

/**
 * Initialize the overlay system
 * Should be called when the page loads
 */
export function initOverlay() {
  // Register global escape key handler
  document.addEventListener("keydown", (e) => {
    if (!overlayEl || overlayEl.style.display !== "flex") return;
    if (e.key === "Escape") hideOverlay();
  });

  // Register hotkey handler
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

    // If our overlay is already open, let its own handler deal with keys
    const overlayOpen = overlayEl && overlayEl.style.display === "flex";
    if (!overlayOpen && !typing && e.altKey && e.shiftKey && (e.key === "y" || e.key === "Y")) {
      e.preventDefault();
      console.log("[yt-quick-jump] fallback hotkey fired");
      showOverlay();
    }
  });
}

/**
 * Show the overlay for timestamp entry
 */
export function showOverlay() {
  try {
    if (!overlayEl) createOverlay();
    backdropEl.style.display = "block";
    overlayEl.style.display = "flex";
    inputEl.value = "";
    setTimeout(() => inputEl.focus(), 0);
    
    // Auto-hide after 30 seconds if left open (recovery mechanism)
    clearTimeout(overlayTimeout);
    overlayTimeout = setTimeout(() => {
      console.log("[yt-quick-jump] Auto-hiding overlay after timeout");
      hideOverlay();
    }, 30000);
  } catch (error) {
    console.error("[yt-quick-jump] Error showing overlay:", error);
    // Try to recover by recreating the overlay
    try {
      resetOverlay();
    } catch (e) {
      console.error("[yt-quick-jump] Failed to reset overlay:", e);
    }
  }
}

/**
 * Hide the overlay
 */
export function hideOverlay() {
  try {
    if (!overlayEl) return;
    overlayEl.style.display = "none";
    backdropEl.style.display = "none";
    
    // Clear auto-hide timeout
    clearTimeout(overlayTimeout);
  } catch (error) {
    console.error("[yt-quick-jump] Error hiding overlay:", error);
  }
}

/**
 * Reset the overlay - useful for recovery after errors
 */
export function resetOverlay() {
  try {
    // Clean up old elements if they exist
    if (overlayEl) overlayEl.remove();
    if (backdropEl) backdropEl.remove();
    
    // Reset variables
    overlayEl = null;
    inputEl = null;
    backdropEl = null;
    
    // Clear any timeouts
    clearTimeout(overlayTimeout);
    
    console.log("[yt-quick-jump] Overlay reset complete");
  } catch (error) {
    console.error("[yt-quick-jump] Error during overlay reset:", error);
  }
}

/**
 * Create the overlay DOM elements
 */
function createOverlay() {
  // Create backdrop
  backdropEl = document.createElement("div");
  backdropEl.className = "yt-quick-jump-backdrop";
  backdropEl.addEventListener("click", hideOverlay);

  // Create overlay panel
  overlayEl = document.createElement("div");
  overlayEl.className = "yt-quick-jump-overlay";

  // Create label
  const label = document.createElement("div");
  label.textContent = "Jump to:";
  label.className = "yt-quick-jump-label";

  // Create input field
  inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.placeholder = "e.g., 1:23:45 or 95s or 123";
  inputEl.spellcheck = false;
  inputEl.className = "yt-quick-jump-input";

  // Create hint text
  const hint = document.createElement("div");
  hint.textContent = "⏎ to jump, Esc to close";
  hint.className = "yt-quick-jump-hint";

  // Add components to overlay
  overlayEl.appendChild(label);
  overlayEl.appendChild(inputEl);
  overlayEl.appendChild(hint);

  // Add overlay to document
  document.documentElement.appendChild(backdropEl);
  document.documentElement.appendChild(overlayEl);

  // Setup input event handlers
  setupInputHandlers();
}

/**
 * Setup event handlers for the input field
 */
function setupInputHandlers() {
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      try {
        const str = inputEl.value.trim();
        const seconds = parseTimestamp(str);
        if (seconds != null) {
          jumpToTime(seconds);
          hideOverlay();
        } else {
          // Invalid input - show error but ensure extension keeps working
          inputEl.classList.add("invalid-input");
          inputEl.placeholder = "Invalid time. Try 1:23:45 or 95s or 123";
          inputEl.value = "";
          
          // Remove error styling after a short delay
          setTimeout(() => {
            if (inputEl) inputEl.classList.remove("invalid-input");
          }, 1500);
          
          // Create recovery message
          const recoverMsg = document.createElement("div");
          recoverMsg.textContent = "Invalid format, try again";
          recoverMsg.className = "yt-quick-jump-error";
          
          overlayEl.appendChild(recoverMsg);
          setTimeout(() => {
            if (recoverMsg.parentNode) recoverMsg.remove();
          }, 2000);
        }
      } catch (error) {
        console.error("[yt-quick-jump] Error processing timecode:", error);
        // Ensure overlay still works after error
        inputEl.placeholder = "Error. Try 1:23:45 or 95s or 123";
        inputEl.value = "";
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      hideOverlay();
    }
  });
}

/**
 * Load the CSS needed for the overlay
 * Note: CSS is loaded automatically via the manifest.json content_scripts
 */
export function loadOverlayStyles() {
  // CSS is now loaded via manifest.json content_scripts
  // This function is kept for compatibility
  console.log("[yt-quick-jump] CSS loaded via manifest");
}