/**
 * YouTube Quick Jump - Time Parser Module
 * Handles parsing various time formats for jumping to specific timestamps
 */

/**
 * Parse various timestamp formats into seconds
 * 
 * Supported formats:
 * - h:m:s or m:s (e.g. "1:23:45" or "1:23")
 * - 1h2m3s (e.g. "1h", "2m30s", "1h30m")
 * - seconds as a number (e.g. "90")
 * 
 * @param {string} str - The timestamp string to parse
 * @returns {number|null} - Number of seconds or null if invalid
 */
export function parseTimestamp(str) {
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

/**
 * Format seconds into a readable timestamp
 * 
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string (e.g. "1:23:45")
 */
export function formatTime(seconds) {
  try {
    if (!Number.isFinite(seconds)) return "--:--";
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  } catch (error) {
    console.error("[yt-quick-jump] Error formatting time:", error);
    return "--:--";
  }
}