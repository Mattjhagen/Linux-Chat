import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { renderMarkdown } from '../utils/markdown.js';
import crypto from 'crypto';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../data/uploads');

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const dest = path.join(uploadDir, year, month);
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: (process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Basic protection - reject executables
    const forbidden = ['.exe', '.sh', '.bat', '.cmd', '.msi'];
    if (forbidden.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
      return cb(new Error('File type not allowed'), false);
    }
    cb(null, true);
  }
});

// Get channel messages
router.get('/channel/:channelId', authenticate, (req, res) => {
  const { channelId } = req.params;
  const { before, limit = 50 } = req.query;

  let query = `
    SELECT m.*, u.username, u.display_name, u.avatar_color,
    (SELECT json_group_array(json_object(
      'id', a.id, 'filename', a.filename, 'originalName', a.original_name, 
      'mimeType', a.mime_type, 'sizeBytes', a.size_bytes
    )) FROM attachments a WHERE a.message_id = m.id) as attachments_json
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.channel_id = ?
  `;
  const params = [channelId];

  if (before) {
    query += ' AND m.id < ?';
    params.push(before);
  }

  query += ' ORDER BY m.id DESC LIMIT ?';
  params.push(parseInt(limit));

  const messages = db.prepare(query).all(...params);
  
  // Format attachments
  const formattedMessages = messages.map(msg => ({
    ...msg,
    attachments: JSON.parse(msg.attachments_json || '[]')
  })).reverse();

  res.json(formattedMessages);
});

// Send message
router.post('/channel/:channelId', authenticate, upload.array('attachments'), (req, res) => {
  const { channelId } = req.params;
  const { content } = req.body;
  const files = req.files || [];

  if (!content && files.length === 0) {
    return res.status(400).json({ error: 'Message content or attachment required' });
  }

  const contentHtml = renderMarkdown(content || '');
  const hasAttachment = files.length > 0 ? 1 : 0;

  const transaction = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO messages (channel_id, user_id, content, content_html, has_attachment)
      VALUES (?, ?, ?, ?, ?)
    `).run(channelId, req.user.id, content || '', contentHtml, hasAttachment);

    const messageId = result.lastInsertRowid;

    for (const file of files) {
      const relativePath = path.relative(path.join(__dirname, '..'), file.path);
      db.prepare(`
        INSERT INTO attachments (message_id, filename, original_name, mime_type, size_bytes, path)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(messageId, file.filename, file.originalname, file.mimetype, file.size, relativePath);
    }

    return messageId;
  });

  try {
    const messageId = transaction();
    
    // Fetch newly created message with user info
    const message = db.prepare(`
       SELECT m.*, u.username, u.display_name, u.avatar_color,
      (SELECT json_group_array(json_object(
        'id', a.id, 'filename', a.filename, 'originalName', a.original_name, 
        'mimeType', a.mime_type, 'sizeBytes', a.size_bytes
      )) FROM attachments a WHERE a.message_id = m.id) as attachments_json
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(messageId);
    
    message.attachments = JSON.parse(message.attachments_json || '[]');
    
    // Broadcast message via Socket.IO
    req.app.get('io').to(`channel-${channelId}`).emit('message:new', message);

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Edit message (own only)
router.patch('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Content required' });

  const msg = db.prepare('SELECT user_id FROM messages WHERE id = ?').get(id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  if (msg.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  const contentHtml = renderMarkdown(content);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE messages SET content = ?, content_html = ?, edited_at = ? WHERE id = ?
  `).run(content, contentHtml, now, id);

  res.json({ id, content, contentHtml, editedAt: now });
});

// Delete message (own or admin)
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const msg = db.prepare('SELECT user_id, channel_id FROM messages WHERE id = ?').get(id);
  
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  
  if (msg.user_id !== req.user.id && req.user.is_admin !== 1) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  res.json({ message: 'Deleted', channelId: msg.channel_id });
});

export default router;
