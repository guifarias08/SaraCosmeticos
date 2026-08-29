require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { db, dbPath } = require('./db');
const { config } = require('./config');

const backupDirectory = path.join(config.projectRoot, 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const snapshotPath = path.join(backupDirectory, `snapshot-${timestamp}`);
const backupDatabasePath = path.join(snapshotPath, 'loja.sqlite');
const backupUploadsPath = path.join(snapshotPath, 'uploads');

fs.mkdirSync(snapshotPath, { recursive: true });
db.exec('PRAGMA wal_checkpoint(FULL)');
fs.copyFileSync(dbPath, backupDatabasePath);

if (fs.existsSync(config.uploadsPath)) {
  fs.cpSync(config.uploadsPath, backupUploadsPath, { recursive: true });
}

console.log(`Backup do banco e das imagens criado em: ${snapshotPath}`);
