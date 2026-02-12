# DreamWeave

A modern dream journaling application built with React, TypeScript, and Tailwind CSS. Features a glass morphism UI design and  dream organization capabilities with analysis.

## Screenshots

### Main Menu
![DreamWeave Menu](images/dreamweavemenu.png)
*The main menu interface with glass morphism design*

### Dream Editor
![DreamWeave Editor](images/dreamweaveeditor.png)
*Create and edit dreams with rich text formatting and citation support*

### Dream Graph
![DreamWeave Graph](images/dreamweavegraph.png)
*Interactive graph visualization showing connections between dreams*

### Citation System
![DreamWeave Citations](images/dreamweavecitations.png)
*Citation management and dream linking features*

## Download

1. Go to the [Release](https://github.com/johnmartinello/Dreamweave/tree/main/release) page
2. Download `DreamWeave-Setup-x.x.x.exe` (latest version)
3. Run the installer and follow the setup wizard
4. Launch DreamWeave from your Start Menu or desktop shortcut

### Alternative: Build from Source
If you prefer to build the application yourself, see the [Installation](#installation) section below.

## Features

### Core Functionality
- **Dream Journaling**: Create, edit, and organize your dreams with rich text descriptions
- **Advanced Tag System**: Hierarchical categorization for dream themes
- **Date Filtering**: Advanced date range filtering with custom calendar interface
- **Search**: Full-text search across dream titles, descriptions, and tags with real-time results
- **Auto-save**: Automatic saving of dream entries as you type
- **Trash Management**: Safely delete and restore dreams with comprehensive trash system

### Hierarchical Tag System ✨
- **Organized Categories**: Dreams are categorized into logical hierarchies (Emotions, Characters, Actions, Places, etc.)
- **Pattern Recognition**: Discover connections between different dream themes over time
- **Custom Categories**: Create your own tag categories and hierarchies
- **Tag Relationships**: See how different tags relate to each other across your dreams

### Citation System ✨
- **Dream Linking**: Connect dreams together by citing other dreams within each entry
- **Inline Mentions**: Use "@" mentions in dream descriptions to automatically create citations
- **Citation Search**: Search and browse other dreams to add as citations
- **Bidirectional Links**: View both dreams you cite and dreams that cite the current dream
- **Citation Preview**: Preview cited dreams without leaving the current editor
- **Automatic Sync**: Citations are automatically synchronized with inline mentions

### Dream Graph Feature ✨
- **Interactive Graph View**: Visualize dream connections using a force-directed graph
- **Graph Filtering**: Filter by date range, tag categories, and connection status
- **Interactive Navigation**: Click on graph nodes to navigate to dream details
- **Multiple Layouts**: Choose between force-directed, hierarchical, and circular layouts
- **Visual Customization**: Node colors based on tag categories, sizes based on citation count

### Security & Privacy
- **Password Protection**: Optional password protection with auto-lock features
- **Local Storage**: All data stored locally on your device
- **Privacy-First**: No data sent to external servers

### User Experience
- **Glass Morphism UI**: Beautiful, modern interface with glass-like effects
- **Responsive Design**: Works seamlessly on desktop and tablet devices
- **Dark Theme**: Optimized for comfortable night-time use
- **Keyboard Shortcuts**: Efficient navigation and editing with keyboard shortcuts
- **Internationalization**: Support for multiple languages (English, Portuguese)

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Graph Visualization**: react-force-graph-2d
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Desktop App**: Electron for cross-platform desktop application

## Getting Started

### Prerequisites
- Node.js 18+ 

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dreamweave
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Running Locally for Testing

### Initial Setup

Before testing, you need to set up the development environment:

1. **Prerequisites:**
   - Ensure you have Node.js 18+ installed
   - Check your Node.js version:
     ```bash
     node --version
     ```
   - Ensure you have npm installed (comes with Node.js):
     ```bash
     npm --version
     ```

2. **Clone the repository:**
   ```bash
   git clone https://github.com/johnmartinello/Dreamweave.git
   cd Dreamweave
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

### Web Browser Testing

To test the application in your web browser:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   - The development server will start on `http://localhost:5173`
   - Open this URL in your preferred browser
   - The app will automatically reload when you make changes to the code

3. **Test features:**
   - Create, edit, and delete dream entries
   - Test the search and filtering functionality
   - Try the citation system and dream graph visualization

### Electron Desktop App Testing

To launch DreamWeave as a separate desktop application:

1. **Launch as standalone desktop app (recommended for testing):**
   ```bash
   npm run electron-dev
   ```
   
   This command will:
   - Start the Vite development server in the background
   - Launch DreamWeave as a separate desktop application window
   - Automatically reload when code changes
   - The app runs independently from your browser

2. **Alternative: Launch built version:**
   ```bash
   npm run build
   npm run electron
   ```
   
   This builds the app first, then launches it as a standalone Electron desktop application.
   
   **Note:** For this method, you'll need to manually start the preview server if needed:
   ```bash
   npm run preview
   ```
   Then in a separate terminal:
   ```bash
   npm run electron
   ```

### Testing Tips

- **Hot Module Replacement**: Changes to React components will automatically update in the browser/Electron window
- **Console Logs**: Check the browser DevTools (F12) or Electron DevTools for debugging information
- **Data Persistence**: Test data is stored locally in your browser's IndexedDB (web) or Electron's user data directory
- **Port Conflicts**: If port 5173 is already in use, Vite will automatically use the next available port

### Troubleshooting

- **Port already in use**: Change the port by modifying `vite.config.js` or using `npm run dev -- --port <port-number>`
- **Dependencies issues**: Run `npm install` again to ensure all dependencies are properly installed
- **Build errors**: Run `npm run lint` to check for code issues before building

