import express from 'express';
import db from '../db/database.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all channels
router.get('/', authenticate, (req, res) => {
  const channels = db.prepare(`
    SELECT c.*, 
    (SELECT COUNT(*) FROM messages m WHERE m.channel_id = c.id) as message_count,
    CASE WHEN ucr.last_read_at IS NULL THEN 1 ELSE 0 END as is_unread
    FROM channels c
    LEFT JOIN user_channel_reads ucr ON c.id = ucr.channel_id AND ucr.user_id = ?
    ORDER BY c.type, c.name
  `).all(req.user.id);
  res.json(channels);
});

// Create channel (admin only)
router.post('/', authenticate, adminOnly, (req, res) => {
  const { name, slug, description, type } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO channels (name, slug, description, type, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, slug, description || '', type || 'text', req.user.id);

    res.status(201).json({ id: result.lastInsertRowid, name, slug, description, type });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Channel slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// Rename/update channel (admin only)
router.patch('/:id', authenticate, adminOnly, (req, res) => {
  const { name, description, type } = req.body;
  const { id } = req.params;

  try {
    db.prepare(`
      UPDATE channels 
      SET name = COALESCE(?, name), 
          description = COALESCE(?, description),
          type = COALESCE(?, type)
      WHERE id = ?
    `).run(name, description, type, id);

    res.json({ message: 'Channel updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

// Delete channel (admin only)
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM channels WHERE id = ?').run(id);
    res.json({ message: 'Channel deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// Mark channel as read
router.post('/:id/read', authenticate, (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO user_channel_reads (user_id, channel_id, last_read_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, channel_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at
    `).run(req.user.id, id, now);

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

export default router;
