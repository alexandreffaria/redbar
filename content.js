(() => {
  let overlayEl = null;
  let inputEl = null;
  let backdropEl = null;

  // Receive command from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "SHOW_OVERLAY") {
      console.log("[yt-quick-jump] SHOW_OVERLAY received");
      try {
        showOverlay();
      } catch (error) {
        console.error("[yt-quick-jump] Error handling SHOW_OVERLAY message:", error);
        resetOverlay();
      }
    } else if (msg?.type === "RESET_OVERLAY") {
      console.log("[yt-quick-jump] RESET_OVERLAY received");
      resetOverlay();
    }
  });

  // In-page fallback hotkey: Alt+Shift+Y
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

  function showOverlay() {
    try {
      if (!overlayEl) createOverlay();
      backdropEl.style.display = "block";
      overlayEl.style.display = "flex";
      inputEl.value = "";
      setTimeout(() => inputEl.focus(), 0);
      
      // Auto-hide after 30 seconds if left open (recovery mechanism)
      clearTimeout(window._ytQuickJumpOverlayTimeout);
      window._ytQuickJumpOverlayTimeout = setTimeout(() => {
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

  function hideOverlay() {
    try {
      if (!overlayEl) return;
      overlayEl.style.display = "none";
      backdropEl.style.display = "none";
      
      // Clear auto-hide timeout
      clearTimeout(window._ytQuickJumpOverlayTimeout);
    } catch (error) {
      console.error("[yt-quick-jump] Error hiding overlay:", error);
    }
  }
  
  // Reset function to recover from errors
  function resetOverlay() {
    try {
      // Clean up old elements if they exist
      if (overlayEl) overlayEl.remove();
      if (backdropEl) backdropEl.remove();
      
      // Reset variables
      overlayEl = null;
      inputEl = null;
      backdropEl = null;
      
      // Clear any timeouts
      clearTimeout(window._ytQuickJumpOverlayTimeout);
      
      console.log("[yt-quick-jump] Overlay reset complete");
    } catch (error) {
      console.error("[yt-quick-jump] Error during overlay reset:", error);
    }
  }

  function createOverlay() {
    // Backdrop
    backdropEl = document.createElement("div");
    Object.assign(backdropEl.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.25)",
      zIndex: "2147483646"
    });
    backdropEl.addEventListener("click", hideOverlay);

    // Panel
    overlayEl = document.createElement("div");
    Object.assign(overlayEl.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "2147483647",
      display: "flex",
      gap: "8px",
      alignItems: "center",
      background: "rgba(20,20,20,0.95)",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: "12px",
      padding: "14px 16px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
      color: "#eee",
    });

    const label = document.createElement("div");
    label.textContent = "Jump to:";
    label.style.opacity = "0.9";

    inputEl = document.createElement("input");
    Object.assign(inputEl, {
      type: "text",
      placeholder: "e.g., 1:23:45 or 95s or 123",
      spellcheck: false
    });
    Object.assign(inputEl.style, {
      width: "220px",
      background: "#111",
      color: "#fff",
      border: "1px solid #333",
      outline: "none",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      transition: "border-color 0.3s"
    });
    
    // Add styles for invalid input
    const style = document.createElement('style');
    style.textContent = `
      .invalid-input {
        border-color: #f44336 !important;
        animation: shake 0.5s;
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(style);

    const hint = document.createElement("div");
    hint.textContent = "⏎ to jump, Esc to close";
    Object.assign(hint.style, { fontSize: "12px", opacity: "0.7" });

    overlayEl.appendChild(label);
    overlayEl.appendChild(inputEl);
    overlayEl.appendChild(hint);

    document.documentElement.appendChild(backdropEl);
    document.documentElement.appendChild(overlayEl);

    // Key handlers while overlay is open
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        try {
          const str = inputEl.value.trim();
          const seconds = parseTimestamp(str);
          if (seconds != null) {
            jumpTo(seconds);
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
            Object.assign(recoverMsg.style, {
              color: "#f44336",
              fontSize: "12px",
              marginTop: "4px",
              fontWeight: "bold",
              position: "absolute",
              bottom: "-24px",
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              opacity: "0",
              animation: "fade-in-out 2s ease-in-out"
            });
            
            // Add fade-in-out animation
            const errorStyle = document.createElement('style');
            errorStyle.textContent = `
              @keyframes fade-in-out {
                0% { opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { opacity: 0; }
              }
            `;
            document.head.appendChild(errorStyle);
            
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

    // Global Esc while open
    document.addEventListener("keydown", (e) => {
      if (overlayEl.style.display !== "flex") return;
      if (e.key === "Escape") hideOverlay();
    });
  }

  function jumpTo(targetSeconds) {
    try {
      const secs = Math.max(0, Number(targetSeconds) || 0);

      // 1) Prefer YouTube's own player API (most robust across SPA updates)
      const ytPlayer = document.getElementById('movie_player');
      if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
        console.log('[yt-quick-jump] using movie_player.seekTo', secs);
        try {
          ytPlayer.seekTo(secs, true);
        } catch (err) {
          console.error('[yt-quick-jump] Error using seekTo:', err);
        }
        return;
      }

      // 2) Shorts: update the URL ?t= and nudge the video
      if (location.pathname.startsWith('/shorts/')) {
        console.log('[yt-quick-jump] shorts mode seek', secs);
        try {
          const url = new URL(location.href);
          url.searchParams.set('t', Math.floor(secs) + 's');
          history.replaceState({}, '', url);
        } catch (err) {
          console.error('[yt-quick-jump] Error updating URL:', err);
        }
        const vShort = pickVideo();
        if (vShort) {
          try {
            vShort.currentTime = secs;
            vShort.play?.();
          } catch (err) {
            console.error('[yt-quick-jump] Error seeking shorts video:', err);
          }
        }
        return;
      }

      // 3) Fallback: operate on the visible <video>
      const video = pickVideo();
      if (!video) return;

      // duration may be NaN right after ad/player swaps — avoid clamping to NaN
      const dur = Number.isFinite(video.duration) ? video.duration : null;
      const clamped = dur ? Math.min(Math.max(0, secs), Math.max(0, dur - 0.001)) : secs;

      console.log('[yt-quick-jump] setting video.currentTime', clamped, '(dur=', dur, ')');
      try {
        video.currentTime = clamped;
        if (video.paused) video.play().catch(() => {});
      } catch (err) {
        console.error('[yt-quick-jump] Error setting currentTime:', err);
      }
    } catch (error) {
      console.error("[yt-quick-jump] General error in jumpTo:", error);
      // Ensure the extension doesn't break even if seeking fails
    }
  }


  function pickVideo() {
  const vids = Array.from(document.querySelectorAll('video'))
    .filter(v => v.readyState > 0 && isElementReallyVisible(v));
  if (!vids.length) return null;

  // Prefer YouTube's main video if present
  const main = vids.find(v => v.classList.contains('html5-main-video'));
  if (main) return main;

  // Otherwise, largest visible one
  let best = null, bestArea = 0;
  for (const v of vids) {
    const r = v.getBoundingClientRect();
    const area = Math.max(0, r.width) * Math.max(0, r.height);
    if (area > bestArea) { bestArea = area; best = v; }
  }
  return best || vids[0];
}

function isElementReallyVisible(el) {
  const r = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return (
    r.width > 10 &&
    r.height > 10 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    r.bottom > 0 && r.right > 0 && r.left < (window.innerWidth || 1) && r.top < (window.innerHeight || 1)
  );
}


  function parseTimestamp(str) {
    try {
      if (!str) return null;
      const s = str.toLowerCase().replace(/\s+/g, "");
      
      // Reject obviously invalid inputs early
      if (s.length > 20) return null;

      // h:m:s or m:s
      if (/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(s)) {
        const parts = s.split(":").map(Number);
        if (parts.some(isNaN)) return null;
        
        if (parts.length === 3) {
          const [h, m, sec] = parts;
          if (m >= 60 || sec >= 60 || !Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(sec)) return null;
          return h * 3600 + m * 60 + sec;
        } else {
          const [m, sec] = parts;
          if (sec >= 60 || !Number.isFinite(m) || !Number.isFinite(sec)) return null;
          return m * 60 + sec;
        }
      }

      // 1h2m3s
      const hms = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
      if (hms && (hms[1] || hms[2] || hms[3])) {
        const h = Number(hms[1] || 0);
        const m = Number(hms[2] || 0);
        const sec = Number(hms[3] || 0);
        
        if (isNaN(h) || isNaN(m) || isNaN(sec)) return null;
        if (m >= 60 || sec >= 60 || !Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(sec)) return null;
        
        return h * 3600 + m * 60 + sec;
      }

      // seconds
      if (/^\d+$/.test(s)) {
        const num = Number(s);
        if (!Number.isFinite(num)) return null;
        return num;
      }
      
      return null;
    } catch (error) {
      console.error("[yt-quick-jump] Error parsing timestamp:", error);
      return null;
    }
  }
})();
