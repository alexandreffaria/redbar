# RedBar - YouTube Quick Jump

A browser extension that allows you to quickly jump to specific timestamps in YouTube videos.

## Features

- Press Alt+Shift+Y (or use the browser action button) to open the timestamp input overlay
- Enter a timestamp in various formats (1:23:45, 1h23m45s, 83m, 3600s, etc.)
- Jump directly to that timestamp in the current YouTube video
- Works with standard YouTube videos and YouTube Shorts
- Right-click context menu option to reset the UI if needed

## Project Structure

The project has been refactored into a modular structure for better maintainability:

```
redbar/
├── src/
│   ├── css/
│   │   └── youtube-overlay.css    # Styles for the overlay UI
│   │
│   ├── js/
│   │   ├── background.js          # Main background script entry point
│   │   ├── content.js             # Main content script entry point
│   │   │
│   │   ├── background/
│   │   │   ├── commands.js        # Handles keyboard shortcuts
│   │   │   └── context-menu.js    # Manages context menu items
│   │   │
│   │   ├── modules/
│   │   │   ├── overlay-ui.js      # Manages the timestamp overlay UI
│   │   │   └── video-controller.js # Handles video finding and seeking
│   │   │
│   │   └── utils/
│   │       └── time-parser.js     # Utilities for parsing time formats
│   │
│   └── manifest.json              # Extension manifest
│
├── package.json                   # NPM package definition
└── rollup.config.js               # Build configuration
```

## Development

### Prerequisites

- Node.js and npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Build

To build the extension:

```
npm run build
```

This will create a `dist` directory with the bundled extension.

### Development Build

To watch for changes and rebuild automatically:

```
npm run watch
```

## Implementation Details

- The extension is organized into modular components with clear separation of concerns
- Error handling is implemented throughout to ensure robustness
- ES modules are used for code organization
- Rollup is used for bundling

## Browser Support

- Chrome / Chromium-based browsers