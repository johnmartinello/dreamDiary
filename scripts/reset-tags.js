#!/usr/bin/env node

// Dream Diary tag reset script
// - Locates Electron userData directory
// - Backs up existing dreams/trashed_dreams JSON files
// - Clears tags on all dreams (sets to [])

const fs = require('fs');
const path = require('path');

function getUserDataPath() {
  const appName = 'Dream Diary';
  switch (process.platform) {
    case 'win32':
      return path.join(process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming'), appName);
    case 'darwin':
      return path.join(process.env.HOME || '', 'Library', 'Application Support', appName);
    default:
      // linux and others
      return path.join(process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || '', '.config'), appName);
  }
}

function backupFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dir, `${base}.backup-${timestamp}`);
    fs.copyFileSync(filePath, backupPath);
    console.log(`Backup created: ${backupPath}`);
  } catch (e) {
    console.warn(`Warning: failed to create backup for ${filePath}:`, e.message);
  }
}

function resetTagsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`No file found (skipping): ${filePath}`);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse JSON: ${filePath}`);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(data)) {
    console.error(`Unexpected format (expected array): ${filePath}`);
    process.exitCode = 1;
    return;
  }

  const updated = data.map((dream) => ({
    ...dream,
    tags: [],
  }));

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  console.log(`Tags cleared in: ${filePath}`);
}

function main() {
  const userData = getUserDataPath();
  console.log(`Using userData path: ${userData}`);

  const dreamsPath = path.join(userData, 'dreams.json');
  const trashedPath = path.join(userData, 'trashed_dreams.json');

  // Backups
  backupFile(dreamsPath);
  backupFile(trashedPath);

  // Reset tags
  resetTagsInFile(dreamsPath);
  resetTagsInFile(trashedPath);

  console.log('Done. You may need to restart Dream Diary to see changes.');
}

main();


