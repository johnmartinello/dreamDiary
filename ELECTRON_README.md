# Dream Diary - Electron App

This is the desktop version of the Dream Diary application built with Electron.

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm

### Running in Development Mode

1. **Start the development server with Electron:**
   ```bash
   npm run electron-dev
   ```
   This will start both the Vite dev server and Electron app simultaneously.

2. **Or run them separately:**
   ```bash
   # Terminal 1: Start Vite dev server
   npm run dev
   
   # Terminal 2: Start Electron (after Vite is running)
   npm run electron
   ```

### Building for Production

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Package the app for distribution:**
   ```bash
   npm run electron-dist
   ```
   This will create distributable packages in the `release` folder.

## Available Scripts

- `npm run electron-dev` - Start development with hot reload
- `npm run electron` - Run Electron app (requires built files)
- `npm run electron-pack` - Build and package the app
- `npm run electron-dist` - Build and create distributable packages

## Features

- **Cross-platform**: Works on Windows, macOS, and Linux
- **Local storage**: Dreams are stored locally on your computer
- **Offline functionality**: Works without internet connection
- **Native app experience**: Looks and feels like a native desktop application

## File Structure

```
├── electron/
│   ├── main.js          # Main Electron process
│   └── preload.js       # Preload script for secure IPC
├── src/
│   └── types/
│       └── electron.d.ts # TypeScript declarations
└── package.json         # Electron configuration
```

## Distribution

The app will be packaged into:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` file
- **Linux**: `.AppImage` file

All distributable files will be created in the `release` folder after running `npm run electron-dist`.

## Security

The app uses Electron's recommended security practices:
- Context isolation enabled
- Node integration disabled
- Preload script for secure IPC communication
- External links opened in default browser
