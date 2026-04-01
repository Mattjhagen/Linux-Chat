import { verifyAccessToken } from '../utils/jwt.js';
import db from '../db/database.js';

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = verifyAccessToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }

  // Fetch full user from DB for fresh state if needed
  const dbUser = db.prepare('SELECT id, username, email, display_name, is_admin, avatar_color FROM users WHERE id = ?').get(user.id);
  
  if (!dbUser) {
    return res.status(403).json({ error: 'User no longer exists' });
  }

  req.user = dbUser;
  next();
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.is_admin !== 1) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export { authenticate, adminOnly };
