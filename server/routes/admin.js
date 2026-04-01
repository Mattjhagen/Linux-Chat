import express from 'express';
import db from '../db/database.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../data/uploads');

router.get('/stats', authenticate, adminOnly, (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const messages = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
  const channels = db.prepare('SELECT COUNT(*) as count FROM channels').get().count;
  
  // Calculate storage used
  let storageBytes = 0;
  const getDirSize = (dirPath) => {
    if (!fs.existsSync(dirPath)) return 0;
    const files = fs.readdirSync(dirPath);
    let size = 0;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
         size += getDirSize(filePath);
      } else {
         size += stat.size;
      }
    }
    return size;
  };
  
  storageBytes = getDirSize(uploadDir);

  res.json({
    users,
    messages,
    channels,
    storageBytes,
    storageMB: (storageBytes / (1024 * 1024)).toFixed(2)
  });
});

export default router;
