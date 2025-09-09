/**
 * YouTube Quick Jump - Video Controller Module
 * Handles finding and controlling YouTube video players
 */

/**
 * Find the best visible video element on the page
 * 
 * @returns {HTMLVideoElement|null} - The best video element or null if none found
 */
export function pickVideo() {
  try {
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
  } catch (error) {
    console.error("[yt-quick-jump] Error picking video:", error);
    return null;
  }
}

/**
 * Check if an element is actually visible on screen
 * 
 * @param {HTMLElement} el - Element to check
 * @returns {boolean} - Whether the element is visible
 */
export function isElementReallyVisible(el) {
  try {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return (
      r.width > 10 &&
      r.height > 10 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      r.bottom > 0 && r.right > 0 && 
      r.left < (window.innerWidth || 1) && 
      r.top < (window.innerHeight || 1)
    );
  } catch (error) {
    console.error("[yt-quick-jump] Error checking visibility:", error);
    return false;
  }
}

/**
 * Jump to a specific time in the current video
 * 
 * Uses multiple strategies:
 * 1. YouTube's native player API (most reliable)
 * 2. Special handling for YouTube Shorts
 * 3. Direct video element manipulation as fallback
 * 
 * @param {number} targetSeconds - The time to jump to in seconds
 * @returns {boolean} - Whether the jump was successful
 */
export function jumpToTime(targetSeconds) {
  try {
    const secs = Math.max(0, Number(targetSeconds) || 0);

    // 1) Prefer YouTube's own player API (most robust across SPA updates)
    const ytPlayer = document.getElementById('movie_player');
    if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
      console.log('[yt-quick-jump] using movie_player.seekTo', secs);
      try { 
        ytPlayer.seekTo(secs, true);
        return true;
      } catch (err) {
        console.error('[yt-quick-jump] Error using seekTo:', err);
      }
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
          return true;
        } catch (err) {
          console.error('[yt-quick-jump] Error seeking shorts video:', err);
        }
      }
      return false;
    }

    // 3) Fallback: operate on the visible <video>
    const video = pickVideo();
    if (!video) return false;

    // duration may be NaN right after ad/player swaps — avoid clamping to NaN
    const dur = Number.isFinite(video.duration) ? video.duration : null;
    const clamped = dur ? Math.min(Math.max(0, secs), Math.max(0, dur - 0.001)) : secs;

    console.log('[yt-quick-jump] setting video.currentTime', clamped, '(dur=', dur, ')');
    try {
      video.currentTime = clamped;
      if (video.paused) video.play().catch(() => {});
      return true;
    } catch (err) {
      console.error('[yt-quick-jump] Error setting currentTime:', err);
      return false;
    }
  } catch (error) {
    console.error("[yt-quick-jump] General error in jumpTo:", error);
    return false;
  }
}