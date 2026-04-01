import express from 'express';
import db from '../db/database.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// List users (admin only)
router.get('/', authenticate, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, username, email, display_name, is_admin, avatar_color, created_at, last_seen FROM users WHERE username != "system"').all();
  res.json(users);
});

// Update profile
router.patch('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { displayName, avatarColor } = req.body;

  if (parseInt(id) !== req.user.id && req.user.is_admin !== 1) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    db.prepare(`
      UPDATE users 
      SET display_name = COALESCE(?, display_name),
          avatar_color = COALESCE(?, avatar_color)
      WHERE id = ?
    `).run(displayName, avatarColor, id);

    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Toggle admin (admin only)
router.patch('/:id/admin', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const { isAdmin } = req.body;

  if (isAdmin === undefined) return res.status(400).json({ error: 'isAdmin status required' });

  try {
    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, id);
    res.json({ message: 'Admin status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update admin status' });
  }
});

// Get online users
router.get('/online', authenticate, (req, res) => {
  // We'll integrate this with the presence store from Socket.IO in index.js
  res.json([]); 
});

export default router;
