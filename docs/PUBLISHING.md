# Publishing to Obsidian Community Store

This guide explains how to publish this plugin to the Obsidian Community Plugins store.

## Prerequisites

1. ✅ Plugin is ready and tested
2. ✅ GitHub repository is public
3. ✅ LICENSE file exists (MIT)
4. ✅ GitHub Actions workflow is configured
5. ✅ manifest.json and versions.json are up to date

## Step 1: Prepare for Release

1. Update version in `manifest.json`:
   ```json
   {
     "version": "1.0.0"
   }
   ```

2. Update `versions.json` with the new version:
   ```json
   {
     "1.0.0": "0.15.0"
   }
   ```

3. Ensure `package.json` version matches:
   ```bash
   npm version 1.0.0
   ```

## Step 2: Build the Plugin

```bash
npm install
npm run build
```

This will create `main.js` in the root directory.

## Step 3: Create a GitHub Release

### Option A: Using GitHub CLI (gh)

```bash
# Create and push a tag
git tag -a 1.0.0 -m "1.0.0"
git push origin 1.0.0

# The GitHub Actions workflow will automatically create a draft release
# Go to GitHub → Releases and publish the draft
```

### Option B: Manual Release

1. Go to your GitHub repository
2. Click on "Releases" → "Create a new release"
3. Create a new tag: `1.0.0`
4. Release title: `1.0.0`
5. Add release notes describing features
6. Upload these files as release assets:
   - `main.js`
   - `manifest.json`
   - `styles.css`
7. Publish the release

## Step 4: Submit to Obsidian Community Store

1. Fork the official plugins repository:
   https://github.com/obsidianmd/obsidian-releases

2. Add your plugin to `community-plugins.json`:
   ```json
   {
     "id": "timeline-plugin",
     "name": "Timeline Plugin",
     "author": "Your Name",
     "description": "Automatically creates timeline visualization of projects and tasks from your vault",
     "repo": "unowneddrive/obsidian-timeline-plugin"
   }
   ```

3. Create a Pull Request with:
   - Title: "Add Timeline Plugin"
   - Description: Brief explanation of what the plugin does
   - Link to your first release (1.0.0)

## Step 5: Wait for Review

- The Obsidian team will review your submission
- They may request changes or ask questions
- Once approved, your plugin will appear in the Community Plugins browser

## Requirements Checklist

Before submitting, ensure:

- [ ] Repository is public on GitHub
- [ ] LICENSE file exists
- [ ] README.md has clear documentation
- [ ] manifest.json is complete and correct
- [ ] versions.json is properly formatted
- [ ] First release (1.0.0) exists with main.js, manifest.json, styles.css
- [ ] Plugin works in latest Obsidian version
- [ ] No hardcoded API keys or secrets
- [ ] Code follows Obsidian plugin guidelines

## After Publication

When you release new versions:

1. Update `manifest.json` version
2. Update `versions.json` with new version
3. Create a new GitHub release with the same files
4. Users will get automatic updates in Obsidian

## Resources

- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Community Plugins Repo](https://github.com/obsidianmd/obsidian-releases)
