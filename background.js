// Receives the command (hotkey) and forwards it to the active YouTube tab
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-timestamp-overlay") return;
  console.log("[redbar] command fired");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (!/^https?:\/\/([^/]+\.)?youtube\.com\//.test(tab.url || "")) {
    console.log("[redbar] not a YouTube tab:", tab.url);
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "SHOW_OVERLAY" });
});
