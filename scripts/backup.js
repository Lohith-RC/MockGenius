/**
 * Backup script for InterviewAI JSON data
 * Usage: node scripts/backup.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

// Read all JSON files from data directory
const data = {};
if (fs.existsSync(DATA_DIR)) {
  const files = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
  
  files.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    data[file.replace('.json', '')] = JSON.parse(content);
  });
}

// Write backup file
fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));

console.log(`✅ Backup created successfully: ${backupFile}`);
console.log(`📁 Files backed up: ${Object.keys(data).length}`);

// Clean up old backups (keep last 7)
const backups = fs.readdirSync(BACKUP_DIR)
  .filter(file => file.startsWith('backup-'))
  .sort()
  .reverse();

if (backups.length > 7) {
  const toDelete = backups.slice(7);
  toDelete.forEach(file => {
    fs.unlinkSync(path.join(BACKUP_DIR, file));
    console.log(`🗑️  Deleted old backup: ${file}`);
  });
}