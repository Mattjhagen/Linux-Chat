import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import db from '../db/database.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../data/uploads');

router.get('/:filename', authenticate, (req, res) => {
  const { filename } = req.params;
  
  // Find file in DB to get its full path
  const attachment = db.prepare('SELECT path, original_name, mime_type FROM attachments WHERE filename = ?').get(filename);
  
  if (!attachment) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(__dirname, '..', attachment.path);

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', attachment.mime_type);
    // res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File missing from storage' });
  }
});

export default router;
