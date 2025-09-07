(() => {
  let overlayEl = null;
  let inputEl = null;
  let backdropEl = null;

  // Receive command from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "SHOW_OVERLAY") {
      console.log("[yt-quick-jump] SHOW_OVERLAY received");
      showOverlay();
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
    if (!overlayEl) createOverlay();
    backdropEl.style.display = "block";
    overlayEl.style.display = "flex";
    inputEl.value = "";
    setTimeout(() => inputEl.focus(), 0);
  }

  function hideOverlay() {
    if (!overlayEl) return;
    overlayEl.style.display = "none";
    backdropEl.style.display = "none";
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
      fontSize: "14px"
    });

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
        const str = inputEl.value.trim();
        const seconds = parseTimestamp(str);
        if (seconds != null) {
          jumpTo(seconds);
          hideOverlay();
        } else {
          inputEl.placeholder = "Invalid time. Try 1:23:45 or 95s or 123";
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
    const secs = Math.max(0, Number(targetSeconds) || 0);

    // 1) Prefer YouTube's own player API (most robust across SPA updates)
    const ytPlayer = document.getElementById('movie_player');
    if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
      console.log('[yt-quick-jump] using movie_player.seekTo', secs);
      try { ytPlayer.seekTo(secs, true); } catch (_) {}
      return;
    }

    // 2) Shorts: update the URL ?t= and nudge the video
    if (location.pathname.startsWith('/shorts/')) {
      console.log('[yt-quick-jump] shorts mode seek', secs);
      try {
        const url = new URL(location.href);
        url.searchParams.set('t', Math.floor(secs) + 's');
        history.replaceState({}, '', url);
      } catch (_) {}
      const vShort = pickVideo();
      if (vShort) {
        try { vShort.currentTime = secs; vShort.play?.(); } catch (_) {}
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
    } catch (_) {}
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
    if (!str) return null;
    const s = str.toLowerCase().replace(/\s+/g, "");

    // h:m:s or m:s
    if (/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(s)) {
      const parts = s.split(":").map(Number);
      if (parts.length === 3) {
        const [h, m, sec] = parts;
        if (m >= 60 || sec >= 60) return null;
        return h * 3600 + m * 60 + sec;
      } else {
        const [m, sec] = parts;
        if (sec >= 60) return null;
        return m * 60 + sec;
      }
    }

    // 1h2m3s
    const hms = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (hms && (hms[1] || hms[2] || hms[3])) {
      const h = Number(hms[1] || 0);
      const m = Number(hms[2] || 0);
      const sec = Number(hms[3] || 0);
      if (m >= 60 || sec >= 60) return null;
      return h * 3600 + m * 60 + sec;
    }

    // seconds
    if (/^\d+$/.test(s)) return Number(s);
    return null;
  }
})();
