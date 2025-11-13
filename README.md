# Timeline Plugin for Obsidian

A plugin for automatically creating timeline visualization of projects and tasks from your Obsidian vault.

## Features

- 📁 **Automatic Project Tracking** - Finds all files with start and end dates in frontmatter
- ✅ **Task Display** - Finds all tasks with `#task` tag in your notes
- 📊 **Modern Gantt-Chart Style** - Professional timeline with horizontal bars and time grid
- 🎨 **Beautiful Visualization** - Clean, modern interface with dark theme support
- ⚡ **Auto-updating** - Timeline updates automatically when files change
- 🔗 **Quick Navigation** - Click on items to open the corresponding file
- 💡 **Interactive Tooltips** - Hover over bars to see detailed information

## Installation

### From Obsidian Community Store (Coming Soon)

Once published, you'll be able to install directly from Obsidian:
1. Open Settings → Community plugins
2. Browse and search for "Timeline Plugin"
3. Click Install, then Enable

### Manual Installation (For Testing)

**Quick method:**
1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/unowneddrive/obsidian-timeline-plugin/releases)
2. Create folder `YourVault/.obsidian/plugins/timeline-plugin/`
3. Copy the files into that folder
4. Reload Obsidian and enable the plugin in Settings

**For detailed instructions, see [Local Installation Guide](docs/LOCAL_INSTALL.md)**

### Development Installation

1. Clone the repository to your vault's plugins folder:
   ```bash
   cd /path/to/your/vault/.obsidian/plugins
   git clone https://github.com/unowneddrive/obsidian-timeline-plugin timeline-plugin
   cd timeline-plugin
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Reload Obsidian and enable the plugin in Settings

**Development mode with auto-rebuild:**
```bash
npm run dev
```

## Usage

### Projects

To display a file as a project in the timeline, add dates to its frontmatter:

```markdown
---
title: My Project
startDate: 2025-01-01
endDate: 2025-03-31
---

Project description...
```

Supported field variants for dates:
- `startDate`, `start-date`, or `start`
- `endDate`, `end-date`, or `end`

### Tasks

To display tasks in the timeline, add the `#task` tag and (optionally) dates:

```markdown
- [ ] Complete design #task 2025-02-15 2025-02-20
- [x] Prepare presentation #task 2025-01-10
```

Dates in `YYYY-MM-DD` format will be automatically recognized as task start and end dates.

### Opening the Timeline

There are several ways:

1. **Sidebar icon** - Click the calendar icon
2. **Command** - Open command palette (`Ctrl/Cmd + P`) and type "Open Timeline View"
3. **Hotkey** - Can be configured in Settings → Hotkeys

## Settings

In the plugin settings you can:

- **Show projects** - Toggle project display on/off
- **Show tasks** - Toggle task display on/off

## Examples

### Example Project File

```markdown
---
title: Web Application Development
startDate: 2025-01-15
endDate: 2025-06-30
---

# Web Application Development

Main project for Q1-Q2 2025.

## Tasks

- [ ] Set up CI/CD #task 2025-01-20 2025-01-25
- [ ] Implement authentication #task 2025-02-01 2025-02-15
- [x] Create mockup #task 2025-01-10 2025-01-12
```

### Example File with Tasks

```markdown
# Daily Tasks

- [ ] Code review PR #123 #task 2025-11-13
- [ ] Update documentation #task 2025-11-14 2025-11-15
- [x] Team meeting #task 2025-11-12
```

## Development

### Project Structure

```
obsidian-timeline-plugin/
├── main.ts           # Main plugin code
├── styles.css        # Timeline styles
├── manifest.json     # Plugin metadata
├── package.json      # npm dependencies
├── tsconfig.json     # TypeScript configuration
└── esbuild.config.mjs # Build configuration
```

### Commands

- `npm run dev` - Development mode with auto-rebuild
- `npm run build` - Production build
- `npm run version` - Update version

## Publishing to Community Store

Want to publish this plugin to the Obsidian Community Plugins store? See [Publishing Guide](docs/PUBLISHING.md) for a complete guide.

**Quick steps:**
1. Build the plugin: `npm run build`
2. Create a GitHub release with `main.js`, `manifest.json`, and `styles.css`
3. Submit a PR to [obsidian-releases](https://github.com/obsidianmd/obsidian-releases)

## Possible Improvements

- [ ] Filters by type (projects/tasks)
- [ ] Timeline search
- [ ] Export to various formats
- [ ] Grouping by categories/tags
- [ ] Zoom and scaling for long timelines
- [ ] Drag and drop to change dates
- [ ] Calendar integration

## License

MIT

## Support

If you encounter issues or have suggestions, please create an issue in the repository.
