# Local Installation Guide

## Method 1: Direct Copy (Recommended for Testing)

1. **Find your Obsidian vault's plugins folder:**
   - Windows: `C:\Users\YourName\Documents\YourVault\.obsidian\plugins\`
   - Mac: `/Users/YourName/Documents/YourVault/.obsidian/plugins/`
   - Linux: `/home/YourName/Documents/YourVault/.obsidian/plugins/`

2. **Create plugin folder:**
   ```bash
   cd /path/to/your/vault/.obsidian/plugins
   mkdir timeline-plugin
   ```

3. **Copy plugin files:**
   Copy these files from the repository to the `timeline-plugin` folder:
   - `main.js` (build it first with `npm run build`)
   - `manifest.json`
   - `styles.css`

4. **Enable the plugin:**
   - Open Obsidian
   - Go to Settings → Community plugins
   - Turn off "Restricted mode" (if enabled)
   - Click "Reload plugins" or restart Obsidian
   - Find "Timeline Plugin" in the list and enable it

## Method 2: Clone & Build

1. **Clone directly into plugins folder:**
   ```bash
   cd /path/to/your/vault/.obsidian/plugins
   git clone https://github.com/unowneddrive/obsidian-timeline-plugin timeline-plugin
   cd timeline-plugin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the plugin:**
   ```bash
   npm run build
   ```

4. **Enable in Obsidian:**
   - Settings → Community plugins → Reload plugins
   - Enable "Timeline Plugin"

## Method 3: Symlink (Best for Development)

If you want to develop the plugin outside your vault:

1. **Build the plugin:**
   ```bash
   cd /path/to/obsidian-timeline-plugin
   npm install
   npm run build
   ```

2. **Create symlink:**

   **Linux/Mac:**
   ```bash
   ln -s /path/to/obsidian-timeline-plugin /path/to/vault/.obsidian/plugins/timeline-plugin
   ```

   **Windows (PowerShell as Administrator):**
   ```powershell
   New-Item -ItemType SymbolicLink -Path "C:\path\to\vault\.obsidian\plugins\timeline-plugin" -Target "C:\path\to\obsidian-timeline-plugin"
   ```

3. **Enable in Obsidian:**
   - Settings → Community plugins → Reload plugins
   - Enable "Timeline Plugin"

## Development Workflow

For active development:

1. **Start dev mode:**
   ```bash
   npm run dev
   ```
   This will watch for changes and rebuild automatically.

2. **Reload plugin in Obsidian:**
   - Open Command Palette (Ctrl/Cmd + P)
   - Type "Reload app without saving"
   - Or manually: Settings → Community plugins → Reload plugins

## Troubleshooting

### Plugin doesn't appear in list
- Make sure the folder is named correctly (no extra characters)
- Check that `manifest.json` exists and is valid
- Restart Obsidian completely

### Plugin won't enable
- Check browser console (Ctrl/Cmd + Shift + I) for errors
- Make sure `main.js` exists (run `npm run build`)
- Verify all required files are present

### Changes not reflecting
- Reload plugins (Settings → Community plugins → Reload)
- Or restart Obsidian
- Check that `npm run dev` is running if in development mode

## Required Files

Your plugin folder must contain at minimum:
```
timeline-plugin/
├── main.js          (built from main.ts)
├── manifest.json
└── styles.css       (optional but recommended)
```

## Quick Test

After installation, test the plugin:
1. Click the calendar icon in the left ribbon
2. Or use Command Palette: "Open Timeline View"
3. Create a test note with:
   ```markdown
   ---
   title: Test Project
   startDate: 2025-01-01
   endDate: 2025-03-31
   ---

   - [ ] Test task #task 2025-01-15
   ```
4. Check if items appear in the timeline
